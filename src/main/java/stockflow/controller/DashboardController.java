
package stockflow.controller;

import stockflow.entity.Product;
import stockflow.repository.ProductRepository;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ProductRepository repository;

    public DashboardController(ProductRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Map<String, Object> getDashboard(
            @RequestParam Long organizationId) {

        List<Product> products =
                repository.findByOrganizationId(organizationId);

        int totalUnits = products.stream()
                .mapToInt(p -> p.getQuantityOnHand() == null
                        ? 0 : p.getQuantityOnHand())
                .sum();

        List<Product> lowStockProducts = products.stream()
                .filter(p -> p.getQuantityOnHand() != null
                        && p.getLowStockThreshold() != null
                        && p.getQuantityOnHand()
                           <= p.getLowStockThreshold())
                .toList();

        BigDecimal inventoryValue = products.stream()
                .map(p -> {
                    BigDecimal price = p.getCostPrice() == null
                            ? BigDecimal.ZERO : p.getCostPrice();

                    int quantity = p.getQuantityOnHand() == null
                            ? 0 : p.getQuantityOnHand();

                    return price.multiply(BigDecimal.valueOf(quantity));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "totalProducts", products.size(),
                "totalUnits", totalUnits,
                "lowStockCount", lowStockProducts.size(),
                "inventoryValue", inventoryValue,
                "lowStockProducts", lowStockProducts
        );
    }
}
