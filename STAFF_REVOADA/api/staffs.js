const { requireAuth } = require("../src/services/authService");
const { sendJson, handleError } = require("../src/services/http");
const { listStaffs } = require("../src/services/staffsService");

module.exports = async (req, res) => {
  try {
    requireAuth(req);
    const staffs = await listStaffs();
    sendJson(res, 200, staffs);
  } catch (error) {
    handleError(res, error);
  }
};