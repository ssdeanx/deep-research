import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';
import * as cheerio from "cheerio";
import { Request, CheerioCrawler } from "crawlee";
import { marked } from "marked";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new PinoLogger({ name: 'WebScraperTool', level: 'info' });

// Input Schema
const webScraperInputSchema = z.object({
  url: z.string().url().describe("The URL of the web page to scrape."),
  selector: z.string().optional().describe("CSS selector for the elements to extract (e.g., 'h1', '.product-title'). If not provided, the entire page content will be extracted."),
  extractAttributes: z.array(z.string()).optional().describe("Array of HTML attributes to extract from selected elements (e.g., 'href', 'src', 'alt')."),
  saveMarkdown: z.boolean().optional().describe("Whether to save the scraped content as markdown to the data directory."),
  markdownFileName: z.string().optional().describe("Optional filename for the markdown file (relative to data/ directory). If not provided, a default name will be generated.")
}).strict();

// Output Schema
const webScraperOutputSchema = z.object({
  url: z.string().url().describe("The URL that was scraped."),
  extractedData: z.array(z.record(z.string(), z.string())).describe("Array of extracted data, where each object represents an element and its extracted attributes/text."),
  rawContent: z.string().optional().describe("The full raw HTML content of the page (if no selector is provided)."),
  markdownContent: z.string().optional().describe("The scraped content converted to markdown format."),
  savedFilePath: z.string().optional().describe("Path to the saved markdown file (if saveMarkdown was true)."),
  status: z.string().describe("Status of the scraping operation (e.g., 'success', 'failed')."),
  errorMessage: z.string().optional().describe("Error message if the operation failed.")
}).strict();

export const webScraperTool = createTool({
  id: "web-scraper",
  description: "Extracts structured data from web pages using cheerio and crawlee.",
  inputSchema: webScraperInputSchema,
  outputSchema: webScraperOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const scrapeSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'web_scrape',
      input: { url: context.url, selector: context.selector, saveMarkdown: context.saveMarkdown, extractAttributesCount: context.extractAttributes?.length || 0 }
    });

    logger.info('Starting web scraping', { url: context.url, selector: context.selector, saveMarkdown: context.saveMarkdown });

    let rawContent: string | undefined;
    let markdownContent: string | undefined;
    let savedFilePath: string | undefined;
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

      // Convert HTML to markdown if rawContent exists
      if (rawContent) {
        try {
          markdownContent = await marked.parse(rawContent);
        } catch (error) {
          logger.warn('Failed to convert HTML to markdown', { error: error instanceof Error ? error.message : String(error) });
          markdownContent = rawContent; // Fallback to raw content
        }
      }

      // Save markdown content if requested
      if (context.saveMarkdown && markdownContent) {
        try {
          const fileName = context.markdownFileName || `scraped_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
          const dataDir = path.join(process.cwd(), 'data');
          const fullPath = path.join(dataDir, fileName);

          // Ensure data directory exists
          await fs.mkdir(dataDir, { recursive: true });

          // Write the markdown content
          await fs.writeFile(fullPath, markdownContent, 'utf-8');
          savedFilePath = fileName;
          logger.info('Markdown content saved', { fileName });
        } catch (error) {
          logger.error('Failed to save markdown file', { error: error instanceof Error ? error.message : String(error) });
          // Don't fail the entire operation if saving fails
        }
      }

      scrapeSpan?.end({ output: { status, extractedDataCount: extractedData.length, contentLength: rawContent?.length || 0, savedFile: !!savedFilePath } });
    } catch (error) {
      errorMessage = `Web scraping failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      const errorMsg = error instanceof Error ? error.message : String(error);
      scrapeSpan?.end({ metadata: { error: errorMsg } });
    }

    return webScraperOutputSchema.parse({
      url: scrapedUrl, // Use the captured scrapedUrl
      extractedData,
      rawContent: context.selector ? undefined : rawContent,
      markdownContent,
      savedFilePath,
      status,
      errorMessage,
    });
  },
});
