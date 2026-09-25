const cds = require('@sap/cds');
const { GET, PATCH, POST, DELETE } = cds.test(__dirname + '/..');

// should be in sync with mock users in package.json
const users = {
  admin: {
    username: 'admin',
    password: 'password',
    email: 'admin@example.com',
  }
};

const services = {
  catalog: '/odata/v4/catalog'
};

const STATUS_BY_METHOD = {
  GET: 200,
  POST: 201,
  PATCH: 200,
  PUT: 200,
  DELETE: 204,
};

class ServiceAPI {
  constructor(servicePath, authConfig) {
    this.servicePath = servicePath;
    this.authConfig = authConfig;
  }

  async GET(url, config = {}) {
    return await GET(`${this.servicePath}${url}`, Object.assign(config, this.authConfig));
  }

  async PATCH(url, data = {}, config = {}) {
    try {
      return await PATCH(`${this.servicePath}${url}`, data, Object.assign(config, this.authConfig));
    } catch (err) {
      return { err };
    }
  }

  async POST(url, data = {}, config = {}) {
    try {
      return await POST(`${this.servicePath}${url}`, data, Object.assign(config, this.authConfig));
    } catch (err) {
      return { err };
    }
  }

  async DELETE(url, config = {}) {
    try {
      return await DELETE(`${this.servicePath}${url}`, Object.assign(config, this.authConfig));
    } catch (err) {
      return { err };
    }
  }

  async assertRequest(method, url, bodyOrCheck, check) {
    let body, checkFn;
    if (typeof bodyOrCheck === 'function') {
      checkFn = bodyOrCheck;
    } else {
      body = bodyOrCheck;
      checkFn = check;
    }

    const res = await this[method](url, ...(body ? [body] : []));

    // expect(res.status).toEqual(STATUS_BY_METHOD[method] ?? 200);
    checkFn?.(res);
    return res;
  }

  assertGet(url, check) { return this.assertRequest('GET', url, check); }
  assertPost(url, body, check) { return this.assertRequest('POST', url, body, check); }
  assertPatch(url, body, check) { return this.assertRequest('PATCH', url, body, check); }
  assertDelete(url, check) { return this.assertRequest('DELETE', url, check); }
}

class UserAPI {
  constructor(config) {
    this.email = config.email;
    this.authConfig = {
      auth: config,
    };

    for (const serviceName in services) {
      this[serviceName] = new ServiceAPI(services[serviceName], this.authConfig);
    }
  }
}

module.exports = {
  users,
  admin: new UserAPI(users.admin)
};