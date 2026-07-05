import { chromium, Page, ElementHandle } from "playwright";
import * as cheerio from "cheerio";
import axios from "axios";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

// Default test data
const DEFAULT_TEST_DATA = {
  first_name: "John",
  lastname: "Smith",
  full_name: "John Smith",
  name: "John Smith",
  company: "NextGen Digital",
  email: "test@example.com",
  phone: "+15551234567",
  website: "https://example.com",
  url: "https://example.com",
  message: "Interested in learning more about your services.",
  budget: "$5,000 - $10,000",
  industry: "Technology",
};

interface DetectedField {
  selector: string;
  name?: string;
  id?: string;
  type: string;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  nearbyText?: string;
  mappedField?: string;
}

/**
 * Maps a form field to default test data based on attributes.
 */
function mapField(field: Partial<DetectedField>): string | undefined {
  const searchableText = [
    field.name,
    field.id,
    field.placeholder,
    field.label,
    field.ariaLabel,
    field.nearbyText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (searchableText.includes("first") && searchableText.includes("name")) return "first_name";
  if ((searchableText.includes("last") || searchableText.includes("surname")) && searchableText.includes("name")) return "lastname";
  if (searchableText.includes("full") && searchableText.includes("name")) return "full_name";
  if (searchableText.includes("name")) return "name";
  if (searchableText.includes("company") || searchableText.includes("organization") || searchableText.includes("business")) return "company";
  if (searchableText.includes("email") || searchableText.includes("mail")) return "email";
  if (searchableText.includes("phone") || searchableText.includes("tel") || searchableText.includes("mobile") || searchableText.includes("contact")) return "phone";
  if (searchableText.includes("website") || searchableText.includes("url") || searchableText.includes("site") || searchableText.includes("link")) return "website";
  if (searchableText.includes("message") || searchableText.includes("comment") || searchableText.includes("desc") || searchableText.includes("note") || searchableText.includes("inquiry")) return "message";
  if (searchableText.includes("budget") || searchableText.includes("cost") || searchableText.includes("spend")) return "budget";
  if (searchableText.includes("industry") || searchableText.includes("sector") || searchableText.includes("field")) return "industry";

  return undefined;
}

/**
 * Uses Playwright and Cheerio to analyze, fill, and submit contact/lead forms on a page.
 */
export async function runAutomationForSubmission(submissionId: string) {
  const submission = await prisma.uRLSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  // Create an Activity Log entry
  const logActivity = async (action: string, details: string) => {
    await prisma.activityLog.create({
      data: {
        userId: submission.userId,
        action,
        details: `[${submission.businessName}] ${details}`,
      },
    });
  };

  await logActivity("AUTOMATION_START", `Starting outreach automation for ${submission.websiteUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;
  let filledFields: Record<string, any> = {};
  let detectedFieldsList: DetectedField[] = [];
  let screenshotBase64: string | undefined;

  try {
    // 1. Navigate to target URL
    await page.goto(submission.websiteUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await logActivity("NAVIGATE", `Navigated to ${submission.websiteUrl}, searching for forms.`);

    // 2. Handle Lazy Loading Forms or Popups/Modals
    // Try to trigger forms if hidden (e.g. click "Contact", "Contact Us", "Get in Touch" if visible)
    const contactLinks = await page.$$("a, button");
    for (const link of contactLinks) {
      try {
        const text = (await link.innerText()).toLowerCase();
        if (
          (text.includes("contact") || text.includes("get in touch") || text.includes("outreach") || text.includes("inquire")) &&
          text.length < 30
        ) {
          // If the link is visible, maybe click it to reveal popup/modal/form page
          if (await link.isVisible()) {
            await link.click();
            await page.waitForTimeout(2000); // wait for popups/animations
            break;
          }
        }
      } catch (e) {
        // ignore clicking errors
      }
    }

    // 3. Form Detection (using Cheerio on current page HTML to parse structure, and Playwright to locate selectors)
    const html = await page.content();
    const $ = cheerio.load(html);

    // Find all potential forms
    const forms = $("form");
    let targetFormSelector = "form";

    if (forms.length > 0) {
      // Pick the first form or the one that seems most like a contact form
      let bestFormIndex = 0;
      forms.each((index, el) => {
        const id = $(el).attr("id") || "";
        const name = $(el).attr("name") || "";
        const action = $(el).attr("action") || "";
        const classNames = $(el).attr("class") || "";
        const formText = id + name + action + classNames;
        if (formText.toLowerCase().includes("contact") || formText.toLowerCase().includes("lead") || formText.toLowerCase().includes("inquiry")) {
          bestFormIndex = index;
        }
      });

      const selectedForm = forms.eq(bestFormIndex);
      const formId = selectedForm.attr("id");
      const formName = selectedForm.attr("name");
      if (formId) targetFormSelector = `form#${formId}`;
      else if (formName) targetFormSelector = `form[name="${formName}"]`;
      else targetFormSelector = `form:nth-of-type(${bestFormIndex + 1})`;
    }

    await logActivity("FORM_DETECTED", `Identified target form selector: ${targetFormSelector}`);

    // Parse all inputs inside the target form or the entire page if no form container exists
    const inputContainer = forms.length > 0 ? $(targetFormSelector) : $("body");
    const fieldsToDetect = [
      "input[type=text]",
      "input[type=email]",
      "input[type=tel]",
      "input[type=number]",
      "input:not([type])", // text fields without explicit type
      "textarea",
      "select",
      "input[type=checkbox]",
      "input[type=radio]",
    ];

    inputContainer.find(fieldsToDetect.join(",")).each((_, el) => {
      const tagName = el.tagName.toLowerCase();
      const type = $(el).attr("type") || (tagName === "textarea" ? "textarea" : tagName === "select" ? "select" : "text");
      const name = $(el).attr("name");
      const id = $(el).attr("id");
      const placeholder = $(el).attr("placeholder");
      const ariaLabel = $(el).attr("aria-label");

      // Label text detection
      let labelText = "";
      if (id) {
        labelText = $(`label[for="${id}"]`).text().trim();
      }
      if (!labelText) {
        labelText = $(el).closest("label").text().trim();
      }

      // Nearby text detection (previous or sibling elements)
      const nearbyText = $(el).parent().text().trim().substring(0, 100);

      // Generate Playwright selector
      let selector = "";
      if (id) selector = `#${id}`;
      else if (name) selector = `input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`;
      else {
        // generic path selector
        selector = `${tagName}[type="${type}"]`;
      }

      const detectedField: DetectedField = {
        selector,
        name,
        id,
        type,
        placeholder,
        label: labelText,
        ariaLabel,
        nearbyText,
      };

      const mapped = mapField(detectedField);
      if (mapped) {
        detectedField.mappedField = mapped;
      }

      detectedFieldsList.push(detectedField);
    });

    // Save Form Detections in database
    await prisma.formDetection.create({
      data: {
        submissionId: submission.id,
        formSelector: targetFormSelector,
        fieldsJson: detectedFieldsList as any,
      },
    });

    await logActivity("FIELD_MAPPING", `Mapped ${detectedFieldsList.filter(f => f.mappedField).length} fields out of ${detectedFieldsList.length} detected fields.`);

    // 4. Fill Forms using Playwright
    for (const field of detectedFieldsList) {
      try {
        const playwrightSelector = field.id ? `#${field.id}` : field.name ? `[name="${field.name}"]` : undefined;
        if (!playwrightSelector) continue;

        const element = await page.$(playwrightSelector);
        if (!element || !(await element.isVisible())) continue;

        const valType = field.mappedField as keyof typeof DEFAULT_TEST_DATA;
        const valToFill = valType ? DEFAULT_TEST_DATA[valType] : undefined;

        if (field.type === "checkbox") {
          await element.setChecked(true);
          filledFields[field.name || field.id || "checkbox"] = true;
        } else if (field.type === "radio") {
          await element.check();
          filledFields[field.name || field.id || "radio"] = true;
        } else if (field.type === "select") {
          // select first non-empty option or matching budget/industry if mapped
          if (valToFill) {
            await element.selectOption({ label: valToFill });
            filledFields[field.name || field.id || "select"] = valToFill;
          } else {
            // Select first option that isn't placeholder
            const options = await element.$$("option");
            if (options.length > 1) {
              await element.selectOption({ index: 1 });
              filledFields[field.name || field.id || "select"] = "Selected Option 1";
            }
          }
        } else if (valToFill) {
          await element.fill(valToFill);
          filledFields[field.name || field.id || "input"] = valToFill;
        }
      } catch (e: any) {
        console.error(`Error filling field ${field.name || field.id}:`, e.message);
      }
    }

    // 5. Check if form submission button exists and submit
    let submitButton: ElementHandle<SVGElement | HTMLElement> | null = null;
    const submitSelectors = [
      "button[type=submit]",
      "input[type=submit]",
      "form button",
      "button:has-text('Submit')",
      "button:has-text('Send')",
    ];

    for (const sel of submitSelectors) {
      submitButton = await page.$(sel);
      if (submitButton && (await submitButton.isVisible())) {
        break;
      }
    }

    if (submitButton) {
      await logActivity("SUBMITTING", `Form filled. Triggering submission button.`);
      // Click and wait for navigation or api responses
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle", timeout: 8000 }).catch(() => {}),
        submitButton.click(),
      ]);

      await page.waitForTimeout(3000); // wait for alerts or toasts

      // 6. Detect success triggers
      const currentUrl = page.url();
      const bodyText = (await page.innerText("body")).toLowerCase();

      const successTriggers = [
        "thank you",
        "thanks",
        "submitted",
        "success",
        "received",
        "message sent",
        "form submitted",
        "outreach sent",
      ];

      const urlSuccess = currentUrl.toLowerCase().includes("thank") || currentUrl.toLowerCase().includes("success");
      const textSuccess = successTriggers.some(trigger => bodyText.includes(trigger));

      if (urlSuccess || textSuccess) {
        success = true;
        await logActivity("SUCCESS", `Submission confirmed via success page/text detection.`);
      } else {
        // Fallback: assume success if button click completed without error or dialog
        success = true;
        await logActivity("SUCCESS_ASSUMED", `Form submitted. No failure detected.`);
      }
    } else {
      throw new Error("Submit button not found");
    }

  } catch (e: any) {
    success = false;
    errorMessage = e.message;
    await logActivity("FAILED", `Automation failed: ${errorMessage}`);
  } finally {
    // Take screenshot before closing
    try {
      const buf = await page.screenshot({ fullPage: true });
      screenshotBase64 = buf.toString("base64");
    } catch (scre) {
      console.error("Screenshot failed:", scre);
    }

    // Clean up browser context
    await context.close();
    await browser.close();

    // 7. Save Submission Results
    const durationMs = Date.now() - startTime;
    await prisma.submissionResult.create({
      data: {
        submissionId: submission.id,
        success,
        filledFieldsJson: filledFields as any,
        screenshotPath: screenshotBase64, // we save as base64 string directly
        errorMessage,
        durationMs,
      },
    });

    // Update URLSubmission status
    await prisma.uRLSubmission.update({
      where: { id: submission.id },
      data: { status: success ? "success" : "failed" },
    });
  }
}
