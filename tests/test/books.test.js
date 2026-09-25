const { admin } = require("./UsersApi");

describe("Books", () => {
  it("success flow", async () => {
    const payload = {
      title: "12345678901",
      enableDetails: true,
      description: "This is a description that should be mandatory when enableDetails is true."
    };
    await admin.catalog.assertPost("/Books", payload, (res) => {
      expect(res.data).toMatchSubset(payload);
      expect(res).toBeSuccessful();
    });
  });

  it("failure flow", async () => {
    const payload = {
      title: "1",
      enableDetails: true
    };
    await admin.catalog.assertPost("/Books", payload, (res) => {
      expect(res).toBeFailed();
      expect(res).toHaveErrorMessagesCount(2);
    });
  });

  it("returns the localized validation message text", async () => {
    const payload = { title: "1" };

    await admin.catalog.assertPost("/Books", payload, (res) => {
      expect(res).toBeFailed();
      expect(res?.err?.response?.data?.error?.message).toEqual("Title cannot be less than 10 characters");
    });
  });

  it("computes field controls on READ based on entity state", async () => {
    await admin.catalog.assertGet("/Books", (res) => {
      expect(res).toBeSuccessful();

      const withDetails = res.data.value.find((b) => b.title === "Wuthering Heights");
      const withoutDetails = res.data.value.find((b) => b.title === "Jane Eyre");

      // enableDetails=true -> Mandatory(7), enableDetails=false -> Hidden(0)
      expect(withDetails.description_fc).toEqual(7);
      expect(withoutDetails.description_fc).toEqual(0);
    });
  });

  it("blocks updates to fields that became read-only/hidden", async () => {
    const created = await admin.catalog.assertPost("/Books", {
      title: "A Read Only Field Test",
      enableDetails: false
    });
    const { ID } = created.data;

    await admin.catalog.assertPatch(`/Books(${ID})`, { description: "should not be allowed" }, (res) => {
      expect(res).toBeFailed();
      expect(res?.err?.response?.data?.error?.message).toEqual("Description is Read-only field");
    });
  });

  it("auto-erases field values once they become hidden", async () => {
    const created = await admin.catalog.assertPost("/Books", {
      title: "Auto Erase Field Test",
      enableDetails: true,
      description: "A description that is long enough to be considered valid."
    });
    const { ID } = created.data;

    await admin.catalog.assertPatch(`/Books(${ID})`, { enableDetails: false }, (res) => {
      expect(res).toBeSuccessful();
    });

    await admin.catalog.assertGet(`/Books(${ID})`, (res) => {
      expect(res).toBeSuccessful();
      expect(res.data.description).toBeNull();
    });
  });

  it("blocks changes to fields without a field control annotation", async () => {
    const created = await admin.catalog.assertPost("/Books", {
      title: "Unannotated Field Test",
      enableDetails: false
    });
    const { ID } = created.data;

    await admin.catalog.assertPatch(`/Books(${ID})`, { stock: 999 }, (res) => {
      expect(res).toBeSuccessful();
    });

    await admin.catalog.assertGet(`/Books(${ID})`, (res) => {
      expect(res).toBeSuccessful();
      expect(res.data.stock).not.toEqual(999);
    });
  });
});

