# Segmentation persistence

Qview exposes neutral labelmap data and a DICOM SEG conversion utility:

```ts
import {
  convertSegmentationToDicom,
  segmentationHandler,
} from "@qureai/react-dicom-viewer";

const exported = segmentationHandler.exportSegmentation(segmentationId);
const dicomSeg = await convertSegmentationToDicom(exported);
```

Annotation Platform creates the DICOM Part 10 SEG file in the browser and sends
it to the authenticated backend as multipart form data. The browser never
receives an S3 upload URL.

## Stored format

Each saved mask is one standard DICOM SEG object. The generated file contains:

- Segmentation Storage SOP Class and `SEG` modality;
- references to the original study, series, and source SOP instances;
- segment labels, colors, coded property metadata, and algorithm provenance;
- the binary segmentation frames.

The backend validates that the upload is a DICOM SEG for the requested study
and that it references the requested source series before storing it.

## API

All routes require authentication and `project_id` as a query parameter.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/patients/{patient}/studies/{study}/series/{series}/segmentations/` | List saved DICOM SEG files |
| `POST` | same collection route | Create a saved segmentation from multipart form data |
| `GET` | `/.../segmentations/{mask}/` | Fetch metadata and a temporary DICOM SEG download URL |
| `PUT` | same detail route | Replace a saved DICOM SEG file |
| `DELETE` | same detail route | Delete the record and stored DICOM SEG object |

`POST` and `PUT` accept:

| Field | Type | Description |
| --- | --- | --- |
| `file` | file | DICOM Part 10 Segmentation Storage object |

The request is handled as one backend operation: Django validates the DICOM,
uploads it to object storage with the `application/dicom` content type, and
uses its content or series description as the display label. Only then does it
return the saved record. Uploads default to a 256 MiB limit, configurable with
`SEGMENTATION_MAX_UPLOAD_BYTES`.

## Viewer workflow

- **Save mask** exports the active qview labelmap, converts it with
  `convertSegmentationToDicom`, and posts the resulting `.dcm` file to Django.
- The application owns the segmentation drawer and subscribes to qview's
  headless `segmentationHandler`. Its mask list loads saved DICOM SEG files
  through `segmentationHandler.importSegmentation`.
- On large screens the drawer occupies a dedicated column beside the viewport;
  on smaller screens it takes over the viewer content area instead of covering
  the image.
- The editor exposes 2D and 3D brushes, threshold tools, contour and scissors
  tools, fill, selection, click segmentation, display controls, and
  active-segment voxel, volume, and intensity metrics.
- Outside a project context, **Save mask** downloads the generated DICOM SEG
  locally.
- The application calls `segmentationHandler.exportSegmentation` and owns
  DICOM metadata choices, save status, confirmation, and persistence.
