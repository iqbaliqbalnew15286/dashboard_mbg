# TODO

- [ ] Periksa seed yang menulis `stock_mutations.purchase_order_id` agar tidak mengacu PO yang tidak ada.
- [ ] Update `database/seeders/DatabaseSeeder.php` agar memanggil `PurchaseOrder`/PO seeder (jika ada) sebelum `StockMutationSeeder`.
- [ ] Update `database/seeders/StockMutationSeeder.php` agar mengaitkan `purchase_order_id` ke data `purchase_orders` yang benar (ambil ID dari DB), atau set ke `null` jika PO tidak ada.
- [ ] Jalankan `php artisan db:seed` untuk validasi tidak ada error foreign key.
- [ ] Jalankan quick check skema/migrasi terkait `stock_mutations` dan relasinya.

