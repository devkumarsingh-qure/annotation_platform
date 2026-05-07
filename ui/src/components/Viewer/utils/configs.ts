import { viewerProvider } from "@qureai/react-dicom-viewer";

const requestTypes = viewerProvider.retrieveConfiguration.requestTypes;

const stackViewportRetrieveConfiguration = {
  stages: [
    {
      id: "lossySequential",
      retrieveType: "singleFast",
    },
    {
      id: "lossySequentialFailure",
      retrieveType: "singleFastFailure",
    },
    {
      id: "lossyMiddle",
      retrieveType: "singleMiddle",
    },
    {
      id: "lossyMiddleFailure",
      retrieveType: "singleMiddleFailure",
    },
    {
      id: "finalSequential",
      retrieveType: "singleFinal",
    },
    {
      id: "errorRetrieve",
    },
  ],
  retrieveOptions: {
    singleFast: {
      decodeLevel: 2,
      chunkSize: 128 * 1024,
      rangeIndex: 0,
    },
    singleFastFailure: {
      decodeLevel: 3,
      rangeIndex: 0,
    },
    singleMiddle: {
      decodeLevel: 0,
      rangeIndex: 10,
    },
    singleMiddleFailure: {
      decodeLevel: 1,
      rangeIndex: 10,
    },
    singleFinal: {
      rangeIndex: -1,
    },
  },
};

const nearbyFrames = [
  {
    offset: -1,
    imageQualityStatus: 3,
  },
  {
    offset: +1,
    imageQualityStatus: 3,
  },
  { offset: +2, imageQualityStatus: 1 },
];

const volumeViewportRetrieveConfiguration = {
  stages: [
    {
      id: "initialImages",
      positions: [0.5, 0, -1],
      retrieveType: "default",
      requestType: requestTypes.Thumbnail,
      priority: 5,
      nearbyFrames,
    },
    {
      id: "quarterThumb",
      decimate: 4,
      offset: 3,
      requestType: requestTypes.Thumbnail,
      retrieveType: "multipleFast",
      priority: 6,
      nearbyFrames,
    },
    {
      id: "halfThumb",
      decimate: 4,
      offset: 1,
      priority: 7,
      requestType: requestTypes.Thumbnail,
      retrieveType: "multipleFast",
      nearbyFrames,
    },
    {
      id: "quarterFull",
      decimate: 4,
      offset: 2,
      priority: 8,
      requestType: requestTypes.Thumbnail,
      retrieveType: "multipleFinal",
    },
    {
      id: "halfFull",
      decimate: 4,
      offset: 0,
      priority: 9,
      requestType: requestTypes.Thumbnail,
      retrieveType: "multipleFinal",
    },
    {
      id: "threeQuarterFull",
      decimate: 4,
      offset: 1,
      priority: 10,
      requestType: requestTypes.Thumbnail,
      retrieveType: "multipleFinal",
    },
    {
      id: "finalFull",
      decimate: 4,
      offset: 3,
      priority: 11,
      requestType: requestTypes.Thumbnail,
      retrieveType: "multipleFinal",
    },
    {
      id: "errorRetrieve",
    },
  ],
  retrieveOptions: {
    multipleFast: {
      rangeIndex: 0,
      chunkSize: 32000,
      decodeLevel: 1,
    },
    multipleFinal: {
      rangeIndex: -1,
    },
  },
};

export {
  stackViewportRetrieveConfiguration,
  volumeViewportRetrieveConfiguration,
};
