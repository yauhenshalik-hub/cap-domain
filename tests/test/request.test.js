const { admin } = require("./UsersApi");

// Request entity is configured (via @FCSettings) with autoErase:false and
// blockUnannotatedValueChanges:false, to demonstrate both flags can be turned off.
describe("Request (autoErase/blockUnannotatedValueChanges disabled)", () => {
  it("does not erase a field's value once it becomes hidden when autoErase is false", async () => {
    const created = await admin.catalog.assertPost("/Request", {
      title: "Auto Erase Disabled Test",
      archived: false,
      internalNotes: "Keep me even after archiving"
    });
    const { ID } = created.data;

    await admin.catalog.assertPatch(`/Request(${ID})`, { archived: true }, (res) => {
      expect(res).toBeSuccessful();
    });

    await admin.catalog.assertGet(`/Request(${ID})`, (res) => {
      expect(res).toBeSuccessful();
      expect(res.data.internalNotes).toEqual("Keep me even after archiving");
    });
  });

  it("allows changes to fields without a field control annotation when blockUnannotatedValueChanges is false", async () => {
    const created = await admin.catalog.assertPost("/Request", {
      title: "Unannotated Field Allowed Test"
    });
    const { ID } = created.data;

    await admin.catalog.assertPatch(`/Request(${ID})`, { note: "freeform note" }, (res) => {
      expect(res).toBeSuccessful();
    });

    await admin.catalog.assertGet(`/Request(${ID})`, (res) => {
      expect(res).toBeSuccessful();
      expect(res.data.note).toEqual("freeform note");
    });
  });
});
