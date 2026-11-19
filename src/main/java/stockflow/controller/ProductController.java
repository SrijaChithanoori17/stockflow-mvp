
package stockflow.controller;

import stockflow.entity.Product;
import stockflow.repository.ProductRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductRepository repository;

    public ProductController(ProductRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Product> getProducts(
            @RequestParam Long organizationId) {

        return repository.findByOrganizationId(organizationId);
    }

    @PostMapping
    public ResponseEntity<?> addProduct(
            @RequestParam Long organizationId,
            @RequestBody Product product) {

        if (product.getSku() == null || product.getSku().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "SKU is required"));
        }

        if (repository.existsByOrganizationIdAndSku(
                organizationId, product.getSku())) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "SKU already exists in this organization"));
        }

        product.setId(null);
        product.setOrganizationId(organizationId);

        return ResponseEntity.ok(repository.save(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestParam Long organizationId,
            @RequestBody Product updated) {

        return repository.findById(id)
            .filter(p -> p.getOrganizationId().equals(organizationId))
            .map(p -> {

                if (repository.existsByOrganizationIdAndSkuAndIdNot(
                        organizationId, updated.getSku(), id)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "SKU already exists"));
                }

                p.setName(updated.getName());
                p.setSku(updated.getSku());
                p.setDescription(updated.getDescription());
                p.setQuantityOnHand(updated.getQuantityOnHand());
                p.setCostPrice(updated.getCostPrice());
                p.setSellingPrice(updated.getSellingPrice());
                p.setLowStockThreshold(updated.getLowStockThreshold());

                return ResponseEntity.ok(repository.save(p));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id,
            @RequestParam Long organizationId) {

        return repository.findById(id)
            .filter(p -> p.getOrganizationId().equals(organizationId))
            .map(p -> {
                repository.delete(p);
                return ResponseEntity.noContent().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
