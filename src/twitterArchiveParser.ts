/**
 * Parses Twitter archive JavaScript files that assign data to window.YTD
 * @param content The raw file content as a string
 * @returns Parsed JSON data or null if parsing fails
 */
export function parseTwitterArchiveFile(content: string): any[] | null {
  try {
    const lines = content.split("\n");

    // Find the first line that starts with window.YTD assignment
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().match(/^window\.YTD\.\w+\.part\d+\s*=\s*\[/)) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      return null;
    }

    // Remove the assignment part and keep just the JSON array
    const firstLine = lines[startIndex];
    const jsonStart = firstLine.indexOf("[");

    if (jsonStart === -1) {
      return null;
    }

    // Reconstruct the content starting from the opening bracket
    const jsonContent =
      firstLine.substring(jsonStart) +
      "\n" +
      lines.slice(startIndex + 1).join("\n");

    // Parse as JSON
    const data = JSON.parse(jsonContent);

    if (!Array.isArray(data)) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error parsing Twitter archive file:", error);
    return null;
  }
}
