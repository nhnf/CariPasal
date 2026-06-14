export const DEFAULT_SOURCE_SLUGS = [
  "jdih-bpk",
  "jdihn",
  "peraturan-go-id",
  "jdih-setneg",
];

export const DISCOVERY_TARGETS = {
  "jdih-bpk": [
    "https://peraturan.bpk.go.id/Search?jenis=1",
    "https://peraturan.bpk.go.id/Search?jenis=2",
    "https://peraturan.bpk.go.id/Search?jenis=3",
    "https://peraturan.bpk.go.id/Search?jenis=4",
  ],
  jdihn: [
    "https://jdihn.go.id/dokumen-hukum/peraturan-perundang-undangan",
    "https://jdihn.go.id/dokumen-hukum",
  ],
  "peraturan-go-id": [
    "https://peraturan.go.id/",
    "https://peraturan.go.id/pp",
    "https://peraturan.go.id/permen",
  ],
  "jdih-setneg": ["https://jdih.setneg.go.id/Terbaru"],
};
