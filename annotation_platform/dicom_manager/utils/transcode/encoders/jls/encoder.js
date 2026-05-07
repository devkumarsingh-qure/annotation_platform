let charls = require('./charlswasm');
const fs = require('fs');
const path = require("path");
const process = require('process');

const height = process.argv[2]
const width = process.argv[3]
const bitsPerSample = process.argv[4]
const isSigned = process.argv[5] == 0 ? false : true
const samplesPerPixel = process.argv[6]
const temp_raw_file = process.argv[7]
const outputPath = process.argv[8]

function encode(codec, height, width, bitsPerSample, isSigned, samplesPerPixel, temp_raw_file, outputPath) {

  const uncompressedImageFrame = fs.readFileSync(temp_raw_file);

  const encoder = new codec.JpegLSEncoder();
  const imageInfo = {
      width: width,
      height: height,
      bitsPerSample,
      componentCount: 1,
      isSigned,
      isUsingColorTransform: false
  }
  const decodedBytes = encoder.getDecodedBuffer(imageInfo);
  decodedBytes.set(uncompressedImageFrame);

  encoder.setNearLossless(0);

  encoder.encode();
  const encodedBytes = encoder.getEncodedBuffer();

  const boundaryId = generateUUID();
  const boundary = `BOUNDARY_${boundaryId}`;
  const closingBoundary = `\r\n--BOUNDARY_${boundaryId}--`;
  const contentType = "image/jls";
  const destinationTransferSyntax = "1.2.840.10008.1.2.4.80";

  const headers = `--${boundary}\r\nContent-Type: ${contentType};transfer-syntax=${destinationTransferSyntax}\r\n\r\n`;

  const fileContent = Buffer.concat([
    Buffer.from(headers, 'utf-8'),
    Buffer.from(encodedBytes),
    Buffer.from(closingBoundary, 'utf-8')
  ]);

  fs.writeFileSync(outputPath, fileContent);

  // cleanup allocated memory
  encoder.delete();

}

charls().then(codec => {
  encode(codec, height, width, bitsPerSample, isSigned, samplesPerPixel, temp_raw_file, outputPath);
})

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
