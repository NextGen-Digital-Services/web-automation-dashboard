import { chromium, Page, FrameLocator } from "playwright";
import * as cheerio from "cheerio";
import { prisma, updateUserAnalytics } from "@/lib/db";

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
 * Handles automated Calendly scheduling if detected on the page.
 */
async function handleCalendlyBooking(
  page: Page,
  userId: string,
  url: string,
  logActivity: (action: string, details: string) => Promise<void>
): Promise<{ success: boolean; bookedDate?: string; bookedTime?: string; error?: string }> {
  await logActivity("CALENDLY_DETECTED", "Calendly scheduling widget detected. Starting auto-booking workflow.");

  // Check if Calendly is inside an iframe, otherwise use page scope
  const hasIframe = (await page.$('iframe[src*="calendly.com"]')) !== null;
  const scope: Page | FrameLocator = hasIframe
    ? page.frameLocator('iframe[src*="calendly.com"]')
    : page;

  try {
    // Wait for the calendar to load (calendly day/month selection)
    // Calendly buttons for days usually match button[data-role="day"] or button[aria-label*="Select"]
    const daySelector = "button[data-role='day'], button[data-testid='day-button'], [data-sk='day'] button, button[aria-label*='Select']";
    
    // Switch month if needed, but we look for first available enabled button
    await page.waitForTimeout(3000); // Give Calendly widget time to load

    // 1. Calculate tomorrow's string to prefer tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomDateStr = tomorrow.getDate().toString(); // e.g. "6"
    
    // Find all clickable day buttons
    let targetDayBtn: any = null;
    if (hasIframe) {
      // In FrameLocator, we find elements using locator
      const dayLocator = scope.locator(daySelector);
      const count = await dayLocator.count();
      
      if (count === 0) {
        throw new Error("No available booking days found on Calendly calendar");
      }

      // Try to find Tomorrow first
      for (let i = 0; i < count; i++) {
        const text = await dayLocator.nth(i).innerText();
        const ariaLabel = await dayLocator.nth(i).getAttribute("aria-label");
        const matchText = (text + " " + (ariaLabel || "")).toLowerCase();
        
        // Match day number or tomorrow indicator
        if (matchText.includes(tomDateStr) || matchText.includes("tomorrow")) {
          targetDayBtn = dayLocator.nth(i);
          break;
        }
      }

      // Fallback: choose first available
      if (!targetDayBtn) {
        targetDayBtn = dayLocator.first();
      }
    } else {
      const dayLocator = page.locator(daySelector);
      const count = await dayLocator.count();
      if (count === 0) {
        throw new Error("No available booking days found on Calendly calendar");
      }
      
      for (let i = 0; i < count; i++) {
        const text = await dayLocator.nth(i).innerText();
        const ariaLabel = await dayLocator.nth(i).getAttribute("aria-label");
        const matchText = (text + " " + (ariaLabel || "")).toLowerCase();
        if (matchText.includes(tomDateStr) || matchText.includes("tomorrow")) {
          targetDayBtn = dayLocator.nth(i);
          break;
        }
      }
      if (!targetDayBtn) {
        targetDayBtn = dayLocator.first();
      }
    }

    // Click the selected day
    await targetDayBtn.click();
    await page.waitForTimeout(2000);

    // 2. Choose Time Slot (Preferred: 10:00 AM)
    const timeSlotSelector = "[data-testid='time-slot'], button[data-role='time-slot'], button[aria-label*='10:00'], button[aria-label*='AM'], button:has-text(':')";
    const timeLocator = scope.locator(timeSlotSelector);
    const timeCount = await timeLocator.count();

    if (timeCount === 0) {
      throw new Error("No available time slots found for the selected day");
    }

    let targetTimeBtn = timeLocator.first();
    for (let i = 0; i < timeCount; i++) {
      const text = await timeLocator.nth(i).innerText();
      if (text.includes("10:00")) {
        targetTimeBtn = timeLocator.nth(i);
        break;
      }
    }

    const bookedTime = await targetTimeBtn.innerText();
    await targetTimeBtn.click();
    await page.waitForTimeout(1500);

    // Click the confirmation or "Next" button (Calendly shows a confirm button next to clicked slot or a primary button)
    const nextBtnSelector = "button:has-text('Next'), button:has-text('Confirm'), [data-testid='time-slot-confirm']";
    const nextBtn = scope.locator(nextBtnSelector);
    if ((await nextBtn.count()) > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(2000);
    }

    // 3. Fill booking form (Name, Email, Phone)
    // Find form fields inside Calendly
    const nameField = scope.locator("input[name='full_name'], input[name='name'], input[autocomplete='name']");
    const emailField = scope.locator("input[name='email'], input[autocomplete='email']");
    const phoneField = scope.locator("input[type='tel'], input[name='phone_number']");

    if ((await nameField.count()) > 0) await nameField.first().fill(DEFAULT_TEST_DATA.full_name);
    if ((await emailField.count()) > 0) await emailField.first().fill(DEFAULT_TEST_DATA.email);
    if ((await phoneField.count()) > 0) await phoneField.first().fill(DEFAULT_TEST_DATA.phone);

    // Click schedule event button
    const scheduleBtnSelector = "button:has-text('Schedule Event'), button:has-text('Book'), button[type='submit']";
    const scheduleBtn = scope.locator(scheduleBtnSelector);
    await scheduleBtn.first().click();
    await page.waitForTimeout(4000); // Wait for confirmation

    // 4. Verify booking success
    const successScreenText = scope.locator("body");
    const bodyText = (await successScreenText.innerText()).toLowerCase();
    
    const isSuccess =
      bodyText.includes("confirmed") ||
      bodyText.includes("scheduled") ||
      bodyText.includes("thank you") ||
      bodyText.includes("you are scheduled");

    if (isSuccess) {
      const today = new Date();
      const bookingDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate() + 1}`; // Approximate tomorrow or nearest
      
      // Save appointment booking
      await prisma.appointmentBooking.create({
        data: {
          userId,
          url,
          bookingDate,
          bookingTime: bookedTime.trim(),
          calendarProvider: "calendly",
          status: "confirmed",
        },
      });

      await logActivity("CALENDLY_BOOKED", `Appointment booked successfully for ${bookingDate} at ${bookedTime}`);
      return { success: true, bookedDate, bookedTime: bookedTime.trim() };
    } else {
      throw new Error("Calendly booking failed: Confirmation screen not detected.");
    }
  } catch (err: any) {
    await logActivity("CALENDLY_FAILED", `Failed to complete Calendly booking: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Runs the upgraded web automation sequence for form filling & auto-booking.
 */
export async function runAutomationForSubmission(submissionId: string) {
  const submission = await prisma.uRLSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  // Create an Activity Log entry helper
  const logActivity = async (action: string, details: string) => {
    await prisma.activityLog.create({
      data: {
        userId: submission.userId,
        action,
        details: `[${submission.businessName}] ${details}`,
      },
    });
  };

  // 1. Create/Initialize AutomationRun record for execution visibility
  const runRecord = await prisma.automationRun.create({
    data: {
      userId: submission.userId,
      url: submission.websiteUrl,
      submissionId: submission.id,
      status: "processing",
    },
  });

  const startTime = Date.now();
  let success = false;
  let failureReason: string | undefined;
  let screenshotBefore: string | undefined;
  let screenshotAfter: string | undefined;
  let submissionProof: string | undefined;
  let detectedFieldsList: DetectedField[] = [];
  let filledFields: Record<string, any> = {};
  let submittedValues: Record<string, any> = {};
  let submitButtonUsed: string | undefined;
  let successMessage: string | undefined;
  let redirectUrl: string | undefined;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    await logActivity("AUTOMATION_RUN_START", `Starting Upgraded Automation Run for URL: ${submission.websiteUrl}`);

    // Navigate to page
    await page.goto(submission.websiteUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Capture screenshot before form interactions
    try {
      const bufBefore = await page.screenshot({ fullPage: true });
      screenshotBefore = bufBefore.toString("base64");
    } catch (e) {
      console.error("Screenshot before failed:", e);
    }

    // 2. Calendly Automatic Detection
    const html = await page.content();
    const hasCalendlyIframe = (await page.$('iframe[src*="calendly.com"]')) !== null;
    const hasCalendlyWidget =
      html.includes("calendly.com") ||
      (await page.$(".calendly-inline-widget")) !== null ||
      (await page.$(".calendly-badge-widget")) !== null;

    if (hasCalendlyIframe || hasCalendlyWidget) {
      // Execute Calendly Auto-Booking Flow
      const calendlyResult = await handleCalendlyBooking(page, submission.userId, submission.websiteUrl, logActivity);
      
      if (calendlyResult.success) {
        success = true;
        submissionProof = `Calendly Booking Confirmed at ${calendlyResult.bookedDate} ${calendlyResult.bookedTime}`;
        successMessage = `Appointment scheduled successfully via Calendly.`;
      } else {
        throw new Error(calendlyResult.error || "Calendly auto booking failed");
      }
    } else {
      // 3. Standard Form Automation Flow
      await logActivity("FORM_SCAN", "Scanning webpage for forms.");

      const $ = cheerio.load(html);
      const forms = $("form");
      let targetFormSelector = "form";

      if (forms.length > 0) {
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

      // Fields to locate
      const fieldSelectors = [
        "input[type=text]",
        "input[type=email]",
        "input[type=tel]",
        "input[type=number]",
        "input:not([type])",
        "textarea",
        "select",
        "input[type=checkbox]",
        "input[type=radio]",
        "input[type=hidden]", // Added hidden fields support
      ];

      const formContainer = forms.length > 0 ? $(targetFormSelector) : $("body");
      formContainer.find(fieldSelectors.join(",")).each((_, el) => {
        const tagName = el.tagName.toLowerCase();
        const type = $(el).attr("type") || (tagName === "textarea" ? "textarea" : tagName === "select" ? "select" : "text");
        const name = $(el).attr("name");
        const id = $(el).attr("id");
        const placeholder = $(el).attr("placeholder");
        const ariaLabel = $(el).attr("aria-label");

        let labelText = "";
        if (id) {
          labelText = $(`label[for="${id}"]`).text().trim();
        }
        if (!labelText) {
          labelText = $(el).closest("label").text().trim();
        }
        const nearbyText = $(el).parent().text().trim().substring(0, 100);

        let selector = "";
        if (id) selector = `#${id}`;
        else if (name) selector = `${tagName}[name="${name}"]`;
        else selector = `${tagName}[type="${type}"]`;

        const detected: DetectedField = {
          selector,
          name,
          id,
          type,
          placeholder,
          label: labelText,
          ariaLabel,
          nearbyText,
        };

        const mapped = mapField(detected);
        if (mapped) {
          detected.mappedField = mapped;
        }
        detectedFieldsList.push(detected);
      });

      // Fill detected forms
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
            submittedValues[field.name || field.id || "checkbox"] = true;
          } else if (field.type === "radio") {
            await element.check();
            filledFields[field.name || field.id || "radio"] = true;
            submittedValues[field.name || field.id || "radio"] = true;
          } else if (field.type === "select") {
            if (valToFill) {
              await element.selectOption({ label: valToFill });
              filledFields[field.name || field.id || "select"] = valToFill;
              submittedValues[field.name || field.id || "select"] = valToFill;
            } else {
              const options = await element.$$("option");
              if (options.length > 1) {
                await element.selectOption({ index: 1 });
                filledFields[field.name || field.id || "select"] = "First Option";
                submittedValues[field.name || field.id || "select"] = "First Option";
              }
            }
          } else if (valToFill) {
            await element.fill(valToFill);
            filledFields[field.name || field.id || "input"] = valToFill;
            submittedValues[field.name || field.id || "input"] = valToFill;
          }
        } catch (e: any) {
          console.error(`Field fill issue: ${field.name}`, e.message);
        }
      }

      // Find and click submit button
      let submitButton = null;
      const submitSelectors = [
        "button[type=submit]",
        "input[type=submit]",
        "form button",
        "button:has-text('Submit')",
        "button:has-text('Send')",
      ];

      for (const sel of submitSelectors) {
        const btn = await page.$(sel);
        if (btn && (await btn.isVisible())) {
          submitButton = btn;
          submitButtonUsed = sel;
          break;
        }
      }

      if (!submitButton) {
        throw new Error("Submit button not found");
      }

      await logActivity("SUBMIT_CLICK", `Clicking form submission button using selector: ${submitButtonUsed}`);
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle", timeout: 8000 }).catch(() => {}),
        submitButton.click(),
      ]);

      await page.waitForTimeout(3000);

      // 4. Success Validation Rules (Strict verification)
      const currentUrl = page.url();
      const bodyText = (await page.innerText("body")).toLowerCase();

      const successWords = ["thank you", "thanks", "submitted", "success", "received", "message sent", "form submitted", "outreach sent"];
      
      const hasSuccessMessage = successWords.some((word) => bodyText.includes(word));
      const isThankYouPage = currentUrl.toLowerCase().includes("thank") || currentUrl.toLowerCase().includes("success") || currentUrl.toLowerCase().includes("confirm");
      const isRedirected = currentUrl !== submission.websiteUrl && !currentUrl.includes(submission.websiteUrl);

      if (hasSuccessMessage || isThankYouPage || isRedirected) {
        success = true;
        submissionProof = `Strict Validation Success. Success Message: ${hasSuccessMessage}, Thank You Page: ${isThankYouPage}, Redirected: ${isRedirected}`;
        successMessage = hasSuccessMessage ? "Success message parsed on page body." : "Redirect confirmed to success target page.";
        redirectUrl = currentUrl;
        await logActivity("SUCCESS", `Strict validation passed. Proof: ${submissionProof}`);
      } else {
        throw new Error("Strict success validation failed. No success text, thank you page, or redirect success detected.");
      }
    }

  } catch (err: any) {
    success = false;
    failureReason = err.message;
    await logActivity("FAILED", `Outreach run failed: ${failureReason}`);
  } finally {
    const durationMs = Date.now() - startTime;

    // Capture screenshot after form interactions
    try {
      const bufAfter = await page.screenshot({ fullPage: true });
      screenshotAfter = bufAfter.toString("base64");
    } catch (e) {
      console.error("Screenshot after failed:", e);
    }

    await context.close();
    await browser.close();

    // 5. Save all logged fields into AutomationRun
    await prisma.automationRun.update({
      where: { id: runRecord.id },
      data: {
        completedAt: new Date(),
        status: success ? "success" : "failed",
        success,
        failureReason,
        screenshotBefore,
        screenshotAfter,
        submissionProof,
        executionTimeMs: durationMs,
        detectedFields: detectedFieldsList as any,
        filledFields: filledFields as any,
        submittedValues: submittedValues as any,
        submitButtonUsed,
        successMessage,
        redirectUrl,
      },
    });

    // Update main URLSubmission status
    await prisma.uRLSubmission.update({
      where: { id: submission.id },
      data: { status: success ? "success" : "failed" },
    });

    // Save legacy Report entry for back-compat
    await prisma.report.upsert({
      where: { id: submission.id }, // we reuse submissionId as primary key or create a new one
      create: {
        submissionId: submission.id,
        userId: submission.userId,
        totalAttempts: 1,
        successfulAttempts: success ? 1 : 0,
        failedAttempts: success ? 0 : 1,
        successRate: success ? 100 : 0,
      },
      update: {
        totalAttempts: { increment: 1 },
        successfulAttempts: { increment: success ? 1 : 0 },
        failedAttempts: { increment: success ? 0 : 1 },
        successRate: success ? 100 : 0,
      },
    });

    await updateUserAnalytics(submission.userId);
  }
}
