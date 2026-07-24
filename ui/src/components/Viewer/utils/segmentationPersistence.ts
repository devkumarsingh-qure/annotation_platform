import {
  convertSegmentationToDicom,
  type ExportedSegmentation,
} from "@qureai/react-dicom-viewer";

type DicomSegmentationFile = Awaited<
  ReturnType<typeof convertSegmentationToDicom>
>;

function prepareDicomSegmentation(
  exported: ExportedSegmentation,
): Promise<DicomSegmentationFile> {
  return convertSegmentationToDicom(exported, {
    fileName: exported.label,
    seriesDescription: `${exported.label} Segmentation`,
  });
}

export async function prepareSegmentationUpload(
  exported: ExportedSegmentation,
) {
  const dicomSegmentation = await prepareDicomSegmentation(exported);
  const formData = new FormData();
  formData.append(
    "file",
    dicomSegmentation.blob,
    dicomSegmentation.fileName,
  );
  return formData;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function downloadDicomSegmentation(
  exported: ExportedSegmentation,
) {
  const dicomSegmentation = await prepareDicomSegmentation(exported);
  downloadBlob(dicomSegmentation.blob, dicomSegmentation.fileName);
}
