
package stockflow.repository;

import stockflow.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByOrganizationId(Long organizationId);

    boolean existsByOrganizationIdAndSku(
            Long organizationId, String sku);

    boolean existsByOrganizationIdAndSkuAndIdNot(
            Long organizationId, String sku, Long id);
}
