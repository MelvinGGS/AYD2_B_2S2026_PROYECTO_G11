import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Tag, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { getProductos } from '../services/api';

export const CatalogoPage = () => {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const isOfertasParam = searchParams.get('ofertas') === 'true';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [onlyOfertas, setOnlyOfertas] = useState(isOfertasParam);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    if (isOfertasParam) {
      setOnlyOfertas(true);
    }
  }, [isOfertasParam]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const data = await getProductos({
        q: urlQuery,
        categoria: selectedCategory === 'Todas' ? '' : selectedCategory,
        ofertas: onlyOfertas,
        maxPrecio: maxPrice,
        enStock: inStockOnly
      });
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [urlQuery, selectedCategory, onlyOfertas, maxPrice, inStockOnly]);

  const categories = ['Todas', 'Línea Blanca', 'Electrónica', 'Ropa', 'Calzado'];

  // El filtrado se ejecuta 100% del lado del backend (inventario-service)
  const filteredProducts = products;

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content catalogo-layout">
        {/* Banner Hero */}
        <div className="hero-banner glass-panel">
          <div className="banner-content">
            <span className="banner-tag">
              <Zap size={14} /> Ofertas Omnicanal
            </span>
            <h1 className="banner-title">Black Friday SGO-Logic</h1>
            <p className="banner-subtitle">
              Hasta 40% de descuento directo en tecnología, electrodomésticos y prendas seleccionadas.
            </p>
          </div>
          <button className="btn-primary banner-btn" onClick={() => setOnlyOfertas(true)}>
            Ver Ofertas Destacadas
          </button>
        </div>

        {/* Catalog Main Content Grid */}
        <div className="catalogo-grid">
          {/* Sidebar Filters */}
          <aside className="filters-sidebar glass-panel">
            <div className="sidebar-header">
              <Filter size={18} className="icon-orange" />
              <h3>Filtros</h3>
            </div>

            {/* Categories */}
            <div className="filter-group">
              <h4>Categorías</h4>
              <ul className="category-list">
                {categories.map(cat => (
                  <li key={cat}>
                    <button
                      className={`category-item ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => { setSelectedCategory(cat); }}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ofertas filter */}
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyOfertas}
                  onChange={(e) => setOnlyOfertas(e.target.checked)}
                />
                <span className="text-orange font-bold">Ver solo Ofertas</span>
              </label>
            </div>

            {/* Price Filter */}
            <div className="filter-group">
              <h4>Precio Máximo (USD)</h4>
              <input
                type="number"
                placeholder="Ej. 500"
                className="form-input"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            {/* Stock Toggle */}
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>Solo productos en stock</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <section className="products-section">
            <div className="section-header">
              <h2>
                {onlyOfertas ? 'Ofertas Especiales Black Friday' : selectedCategory === 'Todas' ? 'Todos los Productos' : selectedCategory}
                {urlQuery && <span className="search-query-label"> — Resultados para "{urlQuery}"</span>}
              </h2>
              <span className="results-count">{filteredProducts.length} productos encontrados</span>
            </div>

            {loading ? (
              <div className="loading-grid">
                <div className="spinner"></div>
                <p>Cargando catálogo unificado...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-results glass-panel">
                <p>No se encontraron productos con los criterios seleccionados.</p>
                <button
                  className="btn-secondary"
                  onClick={() => { setSelectedCategory('Todas'); setMaxPrice(''); setInStockOnly(false); setOnlyOfertas(false); }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
