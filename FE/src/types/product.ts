export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: string;

    factoryId: number;
    factoryName: string;

    categoryId: number;
    categoryName: string;

    imageUrls: string[];

    createdAt: string;
}