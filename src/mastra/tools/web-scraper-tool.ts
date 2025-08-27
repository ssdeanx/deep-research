import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PinoLogger } from "@mastra/loggers";
import * as cheerio from "cheerio";
import { Request, CheerioCrawler } from "crawlee";

const logger = new PinoLogger({ name: 'WebScraperTool', level: 'info' });

// Input Schema
const webScraperInputSchema = z.object({
  url: z.string().url().describe("The URL of the web page to scrape."),
  selector: z.string().optional().describe("CSS selector for the elements to extract (e.g., 'h1', '.product-title'). If not provided, the entire page content will be extracted."),
  extractAttributes: z.array(z.string()).optional().describe("Array of HTML attributes to extract from selected elements (e.g., 'href', 'src', 'alt').")
}).strict();

// Output Schema
const webScraperOutputSchema = z.object({
  url: z.string().url().describe("The URL that was scraped."),
  extractedData: z.array(z.record(z.string(), z.string())).describe("Array of extracted data, where each object represents an element and its extracted attributes/text."),
  rawContent: z.string().optional().describe("The full raw HTML content of the page (if no selector is provided)."),
  status: z.string().describe("Status of the scraping operation (e.g., 'success', 'failed')."),
  errorMessage: z.string().optional().describe("Error message if the operation failed.")
}).strict();

export const webScraperTool = createTool({
  id: "web-scraper",
  description: "Extracts structured data from web pages using cheerio and crawlee.",
  inputSchema: webScraperInputSchema,
  outputSchema: webScraperOutputSchema,
  execute: async ({ context }) => {
    logger.info('Starting web scraping', { url: context.url, selector: context.selector });

    let rawContent: string | undefined;
    const extractedData: Record<string, string>[] = [];
    let status = 'failed';
    let errorMessage: string | undefined;
    let scrapedUrl: string = context.url; // Initialize with context.url, will be updated in handler

    try {
      const crawler = new CheerioCrawler({
        async requestHandler({ request, body }) {
          scrapedUrl = request.url; // Capture the actual URL from the request
          rawContent = body.toString();
          if (context.selector) {
            const $ = cheerio.load(rawContent);
            $(context.selector).each((_i, element) => {
              const data: Record<string, string> = {};
              data.text = $(element).text().trim();
              if (context.extractAttributes) {
                context.extractAttributes.forEach(attr => {
                  const attrValue = $(element).attr(attr);
                  if (attrValue && (typeof attr === "string" &&
                                        !Object.hasOwn(Object.prototype, attr))) {
                        data[attr] = attrValue;
                  }
                });
              }
              extractedData.push(data);
            });
          }
          status = 'success';
        },
        failedRequestHandler({ request, error }) {
          errorMessage = `Failed to scrape ${request.url}: ${error instanceof Error ? error.message : String(error)}`;
          logger.error(errorMessage);
        },
      });

      await crawler.run([new Request({ url: context.url })]);

    } catch (error) {
      errorMessage = `Web scraping failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
    }

    return webScraperOutputSchema.parse({
      url: scrapedUrl, // Use the captured scrapedUrl
      extractedData: extractedData,
      rawContent: context.selector ? undefined : rawContent,
      status: status,
      errorMessage: errorMessage,
    });
  },
});
