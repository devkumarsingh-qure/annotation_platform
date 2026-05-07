let openjphjs = require('./openjphjs.js');
const fs = require('fs');
const path = require("path");
const process = require('process');

const height = parseInt(process.argv[2])
const width = parseInt(process.argv[3])
const bitsPerSample = parseInt(process.argv[4])
const isSigned = process.argv[5] == 0 ? false : true
const samplesPerPixel = parseInt(process.argv[6])
const temp_raw_file = process.argv[7]
const outputPath = process.argv[8]

function encode(height, width, bitsPerSample, isSigned, samplesPerPixel, temp_raw_file, outputPath) {
  const uncompressedImageFrame = fs.readFileSync(temp_raw_file);

  const encoder = new openjphjs.HTJ2KEncoder();
  const imageFrame = {
      width: width,
      height: height,
      bitsPerSample,
      componentCount: samplesPerPixel,
      isSigned,
      isUsingColorTransform: samplesPerPixel > 1 ? true : false,
  }
  const decodedBytes = encoder.getDecodedBuffer(imageFrame);
  decodedBytes.set(uncompressedImageFrame);
  encoder.setTLMMarker(true);
  encoder.setTilePartDivisionsAtResolutions(true);
  encoder.encode();
  const encodedBytes = encoder.getEncodedBuffer();

  const boundaryId = generateUUID();
  const boundary = `BOUNDARY_${boundaryId}`;
  const closingBoundary = `\r\n--BOUNDARY_${boundaryId}--`;
  const contentType = "image/jphc";
  const destinationTransferSyntax = "1.2.840.10008.1.2.4.202";

  const headers = `--${boundary}\r\nContent-Type: ${contentType};transfer-syntax=${destinationTransferSyntax}\r\n\r\n`;

  const fileContent = Buffer.concat([
    Buffer.from(headers, 'utf-8'),
    encodedBytes,
    Buffer.from(closingBoundary, 'utf-8')
  ]);

  fs.writeFileSync(outputPath, fileContent);

  // cleanup allocated memory
  encoder.delete();
}

openjphjs.onRuntimeInitialized = async _ => {
  try {
    encode(height, width, bitsPerSample, isSigned, samplesPerPixel, temp_raw_file, outputPath);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
