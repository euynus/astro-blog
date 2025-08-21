import type { FontStyle, FontWeight } from "satori";
import { readFileSync } from "fs";

export type FontOptions = {
  name: string;
  data: ArrayBuffer;
  weight: FontWeight | undefined;
  style: FontStyle | undefined;
};

async function loadGoogleFont(
  font: string,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const API = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;

    const css = await (
      await fetch(API, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
        },
      })
    ).text();

    const resource = css.match(
      /src: url\((.+)\) format\('(opentype|truetype)'\)/
    );

    if (!resource) throw new Error("Failed to download dynamic font");

    const res = await fetch(resource[1]);

    if (!res.ok) {
      throw new Error("Failed to download dynamic font. Status: " + res.status);
    }

    const fonts: ArrayBuffer = await res.arrayBuffer();
    return fonts;
  } catch (error) {
    console.warn(`Failed to load Google Font ${font}:`, error);
    return null;
  }
}

function loadLocalFont(fontPath: string): ArrayBuffer | null {
  try {
    const fontBuffer = readFileSync(fontPath);
    return fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength);
  } catch (error) {
    console.warn(`Failed to load local font ${fontPath}:`, error);
    return null;
  }
}

async function loadGoogleFonts(
  text: string
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const fontsConfig = [
    {
      name: "IBM Plex Mono",
      font: "IBM+Plex+Mono",
      weight: 400,
      style: "normal",
      localPath: "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff"
    },
    {
      name: "IBM Plex Mono",
      font: "IBM+Plex+Mono:wght@700",
      weight: 700,
      style: "bold",
      localPath: "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff"
    },
  ];

  const fonts = await Promise.all(
    fontsConfig.map(async ({ name, font, weight, style, localPath }) => {
      // Try to load from Google Fonts first
      let data = await loadGoogleFont(font, text);
      
      // If Google Fonts fails, try local font
      if (!data) {
        data = loadLocalFont(localPath);
      }
      
      if (data) {
        return { name, data, weight, style };
      }
      return null;
    })
  );

  // Filter out null results and return only successfully loaded fonts
  const loadedFonts = fonts.filter((font): font is { name: string; data: ArrayBuffer; weight: number; style: string } => 
    font !== null
  );

  // If no fonts loaded, try to load at least one basic font
  if (loadedFonts.length === 0) {
    console.warn("No fonts loaded, attempting to load basic font");
    const basicFontPath = "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff";
    const basicFontData = loadLocalFont(basicFontPath);
    if (basicFontData) {
      loadedFonts.push({
        name: "IBM Plex Mono",
        data: basicFontData,
        weight: 400,
        style: "normal"
      });
    }
  }

  return loadedFonts;
}

export default loadGoogleFonts;
