# TODO - Custom clothes design (Fabric.js) stored as design_file_url

## Step 1: Backend (Spring Boot)
- [x] Add entity `CustomProduct` mapped to `custom_products`
- [x] Add request/response DTOs
- [x] Add repository `CustomProductRepository`
- [x] Add service `CustomProductService`
- [x] Add controller `CustomProductController` with endpoints:
  - [x] POST `/api/custom-products`
  - [x] POST `/api/custom-products/{id}/design-json` (upload JSON)
  - [x] GET `/api/custom-products/{id}`
- [x] Implement JSON storage on backend filesystem and set `design_file_url`

## Step 2: Frontend (React + TypeScript)
- [ ] Add `fabric.js` dependency
- [ ] Create `FE/src/components/ClothesDesignEditor.tsx`
- [ ] Replace `FE/src/pages/CustomOrder.tsx` mock UI with the editor
- [ ] Add API calls (service) to create/open/save custom product

## Step 3: Testing
- [ ] Start backend + frontend
- [ ] Create new design, add text/logo, move/rotate/delete
- [ ] Save draft -> verify backend `design_file_url`
- [ ] Reload draft -> verify objects render correctly

