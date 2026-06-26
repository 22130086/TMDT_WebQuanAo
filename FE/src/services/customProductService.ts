import http from "./http";

export interface CustomProductResponse {
  id: number;
  customerId: number;
  name: string;
  description: string | null;
  designFileUrl: string | null;
  status: "DRAFT" | "POSTED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export interface CustomProductDesignJsonResponse {
  designFileUrl: string;
}

export interface CustomProductCreateRequest {
  name: string;
  description?: string;
  designFileUrl?: string;
  designFileUrlBack?: string;
}

export interface CustomProductDesignJsonRequest {
  jsonBase64: string;
  fileName?: string;
  designFileUrl?: string;
  designFileUrlBack?: string;
}

export async function createCustomProduct(
  payload: CustomProductCreateRequest
) {
  const res = await http.post("/custom-products", payload);
  return res.data as { data: CustomProductResponse; message?: string };
}

export async function getCustomProduct(id: number) {
  const res = await http.get(`/custom-products/${id}`);
  return res.data as { data: CustomProductResponse; message?: string };
}

export async function uploadDesignJson(
  id: number,
  payload: CustomProductDesignJsonRequest
) {
  const res = await http.post(`/custom-products/${id}/design-json`, payload);
  return res.data as {
    data: CustomProductDesignJsonResponse;
    message?: string;
  };
}

