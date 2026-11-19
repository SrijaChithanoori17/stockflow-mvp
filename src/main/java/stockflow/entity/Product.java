
package stockflow.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String sku;
    private String description;
    private Integer quantityOnHand;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private Integer lowStockThreshold;
    private Long organizationId = 1L;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Product() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSku() { return sku; }
    public String getDescription() { return description; }
    public Integer getQuantityOnHand() { return quantityOnHand; }
    public BigDecimal getCostPrice() { return costPrice; }
    public BigDecimal getSellingPrice() { return sellingPrice; }
    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) {
    this.organizationId = organizationId;
}

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setSku(String sku) { this.sku = sku; }
    public void setDescription(String description) { this.description = description; }
    public void setQuantityOnHand(Integer quantityOnHand) { this.quantityOnHand = quantityOnHand; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }
    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }
}
