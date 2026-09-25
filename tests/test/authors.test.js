const { admin } = require("./UsersApi");

describe("Authors", () => {
  it("rejects a name shorter than the configured minimum length", async () => {
    await admin.catalog.assertPost("/Authors", { name: "Al" }, (res) => {
      expect(res).toBeFailed();
      expect(res?.err?.response?.data?.error?.message).toBeTruthy();
    });
  });

  it("accepts a name that satisfies the validator", async () => {
    const payload = { name: "Alexander Pushkin" };

    await admin.catalog.assertPost("/Authors", payload, (res) => {
      expect(res.data).toMatchSubset(payload);
      expect(res).toBeSuccessful();
    });
  });

  it("computes the mandatory field control for name on READ", async () => {
    await admin.catalog.assertGet("/Authors", (res) => {
      expect(res).toBeSuccessful();
      res.data.value.forEach((author) => expect(author.name_fc).toEqual(7));
    });
  });
});
