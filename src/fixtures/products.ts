import type { Product } from "@/server/product";

const clothing = { slug: "mens-clothing", name: "Men's clothing" };
const electronics = { slug: "electronics", name: "Electronics" };

export const fixtureProducts: readonly Product[] = [
  {
    id: "1",
    title: "Canvas daypack",
    description: "A compact daypack with a padded laptop sleeve.",
    category: clothing,
    priceCents: 5990,
    rating: 3.9,
    imageUrl: "/catalogue-fixtures/1.jpg",
  },
  {
    id: "2",
    title: "Raglan cotton tee",
    description: "A lightweight cotton tee with contrasting sleeves.",
    category: clothing,
    priceCents: 2190,
    rating: 4.3,
    imageUrl: "/catalogue-fixtures/2.jpg",
  },
  {
    id: "3",
    title: "Cotton field jacket",
    description: "A midweight jacket with button pockets and an adjustable cuff.",
    category: clothing,
    priceCents: 5599,
    rating: 4.3,
    imageUrl: "/catalogue-fixtures/3.jpg",
  },
  {
    id: "4",
    title: "Slim-fit long sleeve shirt",
    description: "A fitted stretch shirt for everyday wear.",
    category: clothing,
    priceCents: 1599,
    rating: 4.1,
    imageUrl: "/catalogue-fixtures/4.jpg",
  },
  {
    id: "9",
    title: "Portable external drive",
    description: "Portable storage for backups and large files.",
    category: electronics,
    priceCents: 6400,
    rating: 4.8,
    imageUrl: "/catalogue-fixtures/9.jpg",
  },
  {
    id: "10",
    title: "Internal SSD",
    description: "A solid-state drive for a laptop or desktop upgrade.",
    category: electronics,
    priceCents: 10900,
    rating: 3.8,
    imageUrl: "/catalogue-fixtures/10.jpg",
  },
  {
    id: "11",
    title: "SATA SSD kit",
    description: "An internal drive with a mounting bracket for desktop installation.",
    category: electronics,
    priceCents: 9800,
    rating: 4.6,
    imageUrl: "/catalogue-fixtures/11.jpg",
  },
  {
    id: "12",
    title: "Rugged portable drive",
    description: "An external backup drive with a protective shell.",
    category: electronics,
    priceCents: 11400,
    rating: 4.0,
    imageUrl: "/catalogue-fixtures/12.jpg",
  },
];
