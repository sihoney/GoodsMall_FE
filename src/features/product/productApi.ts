import { apiClient } from "../../api/client";
import {
  createCategoryByAdmin as createGeneratedCategoryByAdmin,
  createCategoryBySeller as createGeneratedCategoryBySeller,
  createProduct as createGeneratedProduct,
  deleteCategory as deleteGeneratedCategory,
  deleteImage as deleteGeneratedImage,
  findProduct,
  getCategories as getGeneratedCategories,
  getChildCategories as getGeneratedChildCategories,
  reindexAll as reindexGeneratedAll,
  updateCategoryByAdmin as updateGeneratedCategoryByAdmin,
  updateCategoryBySeller as updateGeneratedCategoryBySeller,
} from "../../api/generated/product/product";

const MAX_PRODUCT_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_COUNT = 5;
const MAX_PRODUCT_IMAGE_TOTAL_SIZE = 30 * 1024 * 1024;

type LooseRecord = Record<string, any>;
type ProductQueryParams = LooseRecord & { sort?: unknown };
type CategoryQueryOptions = {
  depth?: number;
};

const ensureValidImageSize = (file) => {
  if (!file) {
    return;
  }

  if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
    throw new Error("이미지 파일은 각각 5MB 이하여야 합니다.");
  }
};

const ensureValidProductImagePayload = (files) => {
  if (files.length > MAX_PRODUCT_IMAGE_COUNT) {
    throw new Error(`상품 이미지는 최대 ${MAX_PRODUCT_IMAGE_COUNT}장까지 등록할 수 있습니다.`);
  }

  const totalImageSize = files.reduce((sum, file) => sum + (file?.size ?? 0), 0);
  if (totalImageSize > MAX_PRODUCT_IMAGE_TOTAL_SIZE) {
    throw new Error("이미지 요청 전체 크기는 최대 30MB까지 허용됩니다.");
  }
};

const toNumber = (value) => {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toUiImage = (image) => ({
  id: image.imageId,
  s3Key: image.s3Key,
  url: image.presignedUrl || null,
  sortOrder: image.sortOrder ?? 0,
  isThumbnail: Boolean(image.isThumbnail),
  createdAt: image.createdAt,
});

const toUiProduct = (product) => {
  const images = Array.isArray(product.images)
    ? product.images.map(toUiImage)
    : [];
  const thumbnail = images.find((image) => image.isThumbnail) || images[0] || null;

  return {
    id: product.productId,
    name: product.title,
    description: product.description || "상품 설명이 아직 등록되지 않았습니다.",
    price: toNumber(product.price),
    stockCount: product.count ?? 0,
    status: product.status,
    type: product.type ?? "GENERAL",
    createdAt: product.createdAt,
    categoryId: product.categoryId ?? null,
    category: product.categoryName || "미분류",
    image: thumbnail?.url ?? null,
    badge: null,
    images,
  };
};

const toUiCategory = (category) => ({
  id: category.categoryId,
  name: category.name,
  description: category.description || "",
  depth: category.depth ?? 0,
  sortOrder: category.sortOrder ?? 0,
  parentId: category.parentId ?? null,
  sellerId: category.sellerId ?? null,
  createdAt: category.createdAt ?? null,
});

// 수동 호출 유지: 생성 client의 pageable query 객체가 [object Object]로 직렬화될 수 있습니다.
async function getProductsApi(params: ProductQueryParams = {}) {
  const { sort: _sort, ...safeParams } = params;
  const response = await apiClient<LooseRecord>("/api/products", {
    params: safeParams,
  });

  const page = response.data ?? {};

  return {
    items: Array.isArray(page.content) ? page.content.map(toUiProduct) : [],
    pageInfo: {
      page: page.number ?? 0,
      size: page.size ?? 0,
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      first: page.first ?? true,
      last: page.last ?? true,
    },
  };
}

// 수동 호출 유지: 생성 client의 pageable query 객체가 [object Object]로 직렬화될 수 있습니다.
async function getPopularProductsApi(params: ProductQueryParams = {}) {
  const { sort: _sort, ...safeParams } = params;
  const response = await apiClient<LooseRecord>("/api/products/popular", {
    params: safeParams,
  });

  const page = response.data ?? {};

  return {
    items: Array.isArray(page.content) ? page.content.map(toUiProduct) : [],
    pageInfo: {
      page: page.number ?? 0,
      size: page.size ?? 0,
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      first: page.first ?? true,
      last: page.last ?? true,
    },
  };
}

async function getProductDetailApi(productId) {
  const response = await findProduct(productId);
  return toUiProduct(response.data);
}

// 수동 호출 유지: 생성 params에 authenticatedMember/pageable 객체가 포함되어 query 직렬화가 안전하지 않습니다.
async function getSellerProductsApi(params: LooseRecord = {}) {
  const response = await apiClient<LooseRecord>("/api/products/seller", {
    params,
  });

  const page = response.data ?? {};

  return {
    items: Array.isArray(page.content) ? page.content.map(toUiProduct) : [],
    pageInfo: {
      page: page.number ?? 0,
      size: page.size ?? 0,
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      first: page.first ?? true,
      last: page.last ?? true,
    },
  };
}

async function getCategoriesApi(options: CategoryQueryOptions = {}) {
  const { depth } = options;
  const response = await getGeneratedCategories(
    depth === undefined ? undefined : { depth },
  );
  const categories = Array.isArray(response.data) ? response.data : [];

  return categories
    .map(toUiCategory)
    .sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ko");
    });
}

async function getChildCategoriesApi(categoryId) {
  const response = await getGeneratedChildCategories(categoryId);
  const categories = Array.isArray(response.data) ? response.data : [];

  return categories
    .map(toUiCategory)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ko");
    });
}

// 수동 호출 유지: 생성 updateProduct는 현재 API client가 보내지 않는 authenticatedMember query 객체를 요구합니다.
async function updateProductApi(productId, { title, description, price, stockQuantity, categoryId }) {
  const response = await apiClient(`/api/products/${productId}`, {
    method: "PUT",
    body: { title, description: description || null, price, stockQuantity, categoryId },
  });
  return toUiProduct(response.data);
}

async function createProductApi({
  title,
  description,
  price,
  stockQuantity,
  categoryId,
  type = "GENERAL",
  images = [],
  thumbnailIndex = 0,
}) {
  const formData = new FormData();

  formData.append(
    "productData",
    JSON.stringify({
      title,
      description: description || null,
      price,
      stockQuantity,
      categoryId,
      type,
    })
  );

  const imageFiles = images.map((image) => image.file ?? image);
  imageFiles.forEach(ensureValidImageSize);
  ensureValidProductImagePayload(imageFiles);

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  if (images.length > 0) {
    formData.append("thumbnailIndex", String(thumbnailIndex));
  }

  const response = await createGeneratedProduct(
    {
      productData: String(formData.get("productData") ?? ""),
      images: imageFiles,
    },
    images.length > 0 ? { thumbnailIndex } : undefined,
  );

  return toUiProduct(response.data);
}

// 수동 호출 유지: 생성 uploadImage는 JSON으로 전송되지만 이 endpoint는 multipart FormData가 필요합니다.
async function uploadProductImageApi(productId, file, { sortOrder = 0, isThumbnail = false } = {}) {
  ensureValidImageSize(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("sortOrder", String(sortOrder));
  formData.append("isThumbnail", String(isThumbnail));

  const response = await apiClient(`/api/products/${productId}/images`, {
    method: "POST",
    body: formData,
  });
  return toUiImage(response.data);
}

async function deleteProductImageApi(productId, imageId) {
  await deleteGeneratedImage(productId, imageId);
}

async function createCategoryAdminApi({ name, description, sortOrder, parentId }) {
  const response = await createGeneratedCategoryByAdmin({
    name,
    ...(description ? { description } : {}),
    sortOrder: Number(sortOrder) || 0,
    ...(parentId ? { parentId } : {}),
  });
  return toUiCategory(response.data);
}

async function createCategorySellerApi({ name, description, sortOrder, parentId }) {
  const response = await createGeneratedCategoryBySeller({
    name,
    ...(description ? { description } : {}),
    sortOrder: Number(sortOrder) || 0,
    ...(parentId ? { parentId } : {}),
  });
  return toUiCategory(response.data);
}

async function updateCategoryAdminApi(categoryId, { name, description, sortOrder }) {
  const response = await updateGeneratedCategoryByAdmin(categoryId, {
    name,
    ...(description ? { description } : {}),
    sortOrder: Number(sortOrder) || 0,
  });
  return toUiCategory(response.data);
}

async function updateCategorySellerApi(categoryId, { name, description, sortOrder }) {
  const response = await updateGeneratedCategoryBySeller(categoryId, {
    name,
    ...(description ? { description } : {}),
    sortOrder: Number(sortOrder) || 0,
  });
  return toUiCategory(response.data);
}

async function deleteCategoryApi(categoryId) {
  await deleteGeneratedCategory(categoryId);
}

// 수동 호출 유지: 생성 client의 배열 query 직렬화가 기존 repeated productIds 계약과 다를 수 있습니다.
async function getProductsByIdsApi(productIds) {
  if (!productIds || productIds.length === 0) return [];
  const query = productIds.map((id) => `productIds=${encodeURIComponent(id)}`).join("&");
  const response = await apiClient(`/api/products/by-ids?${query}`);
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(toUiProduct);
}

async function reindexProductsEsApi() {
  const response = await reindexGeneratedAll();
  return response.data;
}

export {
  createProductApi,
  updateProductApi,
  uploadProductImageApi,
  deleteProductImageApi,
  getCategoriesApi,
  getChildCategoriesApi,
  getProductDetailApi,
  getProductsByIdsApi,
  getProductsApi,
  getPopularProductsApi,
  getSellerProductsApi,
  createCategoryAdminApi,
  createCategorySellerApi,
  updateCategoryAdminApi,
  updateCategorySellerApi,
  deleteCategoryApi,
  reindexProductsEsApi,
};



