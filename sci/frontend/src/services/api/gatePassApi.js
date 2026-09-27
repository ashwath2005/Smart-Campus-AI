import api from './client';
import { ENDPOINTS } from './endpoints';

export const gatePassApi = {
  getMyGatePasses: () => api.get(ENDPOINTS.GATE_PASS.STUDENT),
  requestGatePass: (payload) => api.post(ENDPOINTS.GATE_PASS.REQUEST, payload),
  approveGatePass: (id, decision) => api.post(ENDPOINTS.GATE_PASS.APPROVE(id), decision),
  verifyGatePass: (qrCodeData) => api.post(ENDPOINTS.GATE_PASS.SECURITY_VERIFY, { qr_data: qrCodeData }),
  getGuardianGatePasses: () => api.get(ENDPOINTS.GATE_PASS.GUARDIAN),
};

export default gatePassApi;
