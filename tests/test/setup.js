expect.extend({
  toMatchSubset(received, expected) {
    const isSubset = (A, B) =>
      Object.entries(B).every(([key, val]) =>
        val && typeof val === "object"
          ? isSubset(A[key] ?? {}, val)
          : A[key] === val
      );

    const pass = received != null && isSubset(received, expected);

    return {
      pass,
      message: () =>
        pass
          ? `expected received object NOT to contain all fields of expected, but it did.\nExpected: ${JSON.stringify(expected, null, 2)}\nReceived: ${JSON.stringify(received, null, 2)}`
          : `expected received object to contain all fields of expected.\nExpected: ${JSON.stringify(expected, null, 2)}\nReceived: ${JSON.stringify(received, null, 2)}\nMissing or mismatched keys: ${Object.entries(expected)
            .filter(([key, val]) => received[key] !== val)
            .map(([key]) => key)
            .join(", ")
          }`,
    };
  },

  toBeSuccessful(res) {
    const status = res?.status;
    const pass = status >= 200 && status <= 299;
    return {
      pass,
      message: () =>
        `expected status ${status} to be in 2xx range, but received ${JSON.stringify(res?.err?.response?.data ?? res?.data)}`,
    };
  },

  toBeFailed(res) {
    const status = res?.err?.status;
    const pass = status >= 400 && status <= 499;
    return {
      pass,
      message: () =>
        `expected status ${status} to be in 4xx range, but received ${JSON.stringify(res?.err?.response?.data ?? res?.data)}`,
    };
  },

  toHaveErrorMessagesCount(res, expectedCount) {
    const errors = res?.err?.response?.data?.error?.details || [];
    const pass = errors.length === expectedCount;
    return {
      pass,
      message: () =>
        `expected error messages count to be ${expectedCount}, but received ${errors.length}. Errors: ${JSON.stringify(errors)}`,
    };
  }
});