# Real format fixtures

These files are small, self-contained fixtures used by the integration tests. They contain complete format structures where a compact fixture is practical:

- the image fixtures are 1-pixel PNG, GIF, and JPEG files;
- `sample.pdf` is a valid minimal PDF document;
- `sample.wav` is a valid empty PCM WAV container;
- `sample.gz` is a gzip stream containing text;
- `sample.tar` is a USTAR archive containing one file;
- Office, JAR, EPUB, IPA, and VSIX fixtures are valid stored ZIP archives with the identifying entries required by each container format;
- `sample.sqlite` is created by Python's standard SQLite implementation and contains one table and one row;
- `sample.wasm` is the valid empty WebAssembly module;
- SVG and EML fixtures are complete text documents.

The tests pass an unrelated filename to the buffer API so the expected results come from file contents and container structure.
