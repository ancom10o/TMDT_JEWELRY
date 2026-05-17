/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../components/admin/AdminModal.jsx';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
  createBanner,
  createHomeSection,
  deleteBanner,
  deleteHomeSection,
  getAdminHomepage,
  getPublicAssetUrl,
  reorderHomeSections,
  updateBanner,
  updateHomeSection
} from '../services/api.js';
import { BANNER_TYPE_OPTIONS, getBannerTypeMeta } from '../utils/media.js';
import { buildDefaultSettings, getSectionTypeMeta, normalizeSection, sectionTypeOptions } from '../utils/homeSections.js';

const initialBannerFormState = {
  name: '',
  bannerType: 'hero',
  imageUrl: '',
  mobileImageUrl: '',
  title: '',
  subtitle: '',
  buttonLabel: '',
  buttonLink: '/products',
  isActive: true
};

function createEmptyItem() {
  return {
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '',
    icon: '',
    color: ''
  };
}

function createInitialSectionFormState(order = 1) {
  return {
    key: '',
    type: 'hero_banner',
    title: '',
    subtitle: '',
    description: '',
    buttonLabel: '',
    buttonLink: '/products',
    order,
    isActive: true,
    banners: [],
    products: [],
    items: [],
    settings: buildDefaultSettings('hero_banner')
  };
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSectionFormState(section) {
  const normalizedSection = normalizeSection(section);

  return {
    key: normalizedSection.key || '',
    type: normalizedSection.type || 'hero_banner',
    title: normalizedSection.title || '',
    subtitle: normalizedSection.subtitle || '',
    description: normalizedSection.description || '',
    buttonLabel: normalizedSection.buttonLabel || '',
    buttonLink: normalizedSection.buttonLink || '/products',
    order: Number(normalizedSection.order) || 1,
    isActive: normalizedSection.isActive !== false,
    banners: normalizedSection.banners.map((banner) => banner._id || banner),
    products: normalizedSection.products.map((product) => product._id || product),
    items: normalizedSection.items.length ? normalizedSection.items : [],
    settings: {
      ...buildDefaultSettings(normalizedSection.type),
      ...(normalizedSection.settings || {})
    }
  };
}

function buildBannerFormState(banner) {
  return {
    name: banner.name || '',
    bannerType: banner.bannerType || 'hero',
    imageUrl: banner.imageUrl || '',
    mobileImageUrl: banner.mobileImageUrl || '',
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    buttonLabel: banner.buttonLabel || '',
    buttonLink: banner.buttonLink || '/products',
    isActive: Boolean(banner.isActive)
  };
}

function ensureItemsForType(type, items) {
  if (type === 'image_text_block') {
    return items.length ? [items[0]] : [createEmptyItem()];
  }

  return items;
}

function buildSectionPayload(formState) {
  const basePayload = {
    key: normalizeSlug(formState.key),
    type: formState.type,
    title: formState.title.trim(),
    subtitle: formState.subtitle.trim(),
    description: formState.description.trim(),
    buttonLabel: formState.buttonLabel.trim(),
    buttonLink: formState.buttonLink.trim(),
    order: Number(formState.order) || 1,
    isActive: formState.isActive,
    settings: {}
  };

  switch (formState.type) {
    case 'hero_banner':
      return {
        ...basePayload,
        banners: formState.banners,
        settings: {
          autoplay: formState.settings.autoplay !== false
        }
      };
    case 'category_grid':
      return {
        ...basePayload,
        items: formState.items,
        settings: {
          columns: Number(formState.settings.columns) || 4,
          showButton: formState.settings.showButton !== false
        }
      };
    case 'product_slider':
      return {
        ...basePayload,
        products: formState.settings.sourceMode === 'query' ? [] : formState.products,
        settings: {
          limit: formState.settings.sourceMode === 'query' ? 8 : formState.products.length || 8,
          variant: formState.settings.variant || 'listing',
          sourceMode: formState.settings.sourceMode || 'manual',
          productQuery: formState.settings.productQuery || '/products'
        }
      };
    case 'promo_banner':
      return {
        ...basePayload,
        banners: formState.banners
      };
    case 'image_text_block':
      return {
        ...basePayload,
        items: formState.items.slice(0, 1),
        settings: {
          layout: formState.settings.layout || 'imageLeft'
        }
      };
    case 'service_grid':
      return {
        ...basePayload,
        items: formState.items,
        settings: {
          columns: Number(formState.settings.columns) || 4
        }
      };
    case 'collection_cards':
      return {
        ...basePayload,
        items: formState.items,
        settings: {
          columns: Number(formState.settings.columns) || 3,
          variant: formState.settings.variant || 'standard',
          showButton: formState.settings.showButton !== false
        }
      };
    default:
      return basePayload;
  }
}

function ItemEditor({ label, items, onAdd, onRemove, onChange, fields, minItems = 0 }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="field-label">{label}</p>
        <button type="button" onClick={onAdd} className="btn-outline !px-4 !py-2">
          Them item
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-navy">Item {index + 1}</p>
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={items.length <= minItems}
                className="text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Xoa
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                  <span className="field-label">{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      rows="3"
                      value={item[field.name] || ''}
                      onChange={(event) => onChange(index, field.name, event.target.value)}
                      className="textarea-field"
                    />
                  ) : (
                    <input
                      value={item[field.name] || ''}
                      onChange={(event) => onChange(index, field.name, event.target.value)}
                      className="input-field"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        {!items.length ? <div className="rounded-[24px] border border-dashed border-slate-300 p-4 text-sm text-slate-500">Chua co item nao.</div> : null}
      </div>
    </div>
  );
}

function AdminHomepagePage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [draggingId, setDraggingId] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [sectionFormState, setSectionFormState] = useState(createInitialSectionFormState());
  const [productSearchKeyword, setProductSearchKeyword] = useState('');
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionSubmitting, setSectionSubmitting] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerFormState, setBannerFormState] = useState(initialBannerFormState);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerSubmitting, setBannerSubmitting] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  const activeSections = useMemo(() => sections.filter((section) => section.isActive).length, [sections]);
  const sectionTypeMeta = useMemo(() => getSectionTypeMeta(sectionFormState.type), [sectionFormState.type]);
  const selectedProductsPreview = useMemo(
    () => products.filter((product) => sectionFormState.products.includes(product._id)),
    [products, sectionFormState.products]
  );
  const selectedBannersPreview = useMemo(
    () => banners.filter((banner) => sectionFormState.banners.includes(banner._id)),
    [banners, sectionFormState.banners]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageConfig() {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await getAdminHomepage(token);

        if (!isMounted) {
          return;
        }

        setSections(Array.isArray(response.sections) ? response.sections.map((section) => normalizeSection(section)) : []);
        setProducts(response.products || []);
        setBanners(response.banners || []);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'Khong the tai cau hinh homepage.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHomepageConfig();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function openCreateSectionModal() {
    setEditingSection(null);
    setProductSearchKeyword('');
    setSectionFormState({
      ...createInitialSectionFormState(sections.length + 1),
      key: `section-${sections.length + 1}`
    });
    setIsSectionModalOpen(true);
  }

  function openEditSectionModal(section) {
    setEditingSection(section);
    setProductSearchKeyword('');
    setSectionFormState(buildSectionFormState(section));
    setIsSectionModalOpen(true);
  }

  function openCreateBannerModal() {
    setEditingBanner(null);
    setBannerFormState(initialBannerFormState);
    setIsBannerModalOpen(true);
  }

  function openEditBannerModal(banner) {
    setEditingBanner(banner);
    setBannerFormState(buildBannerFormState(banner));
    setIsBannerModalOpen(true);
  }

  function handleSectionChange(event) {
    const { name, value, type, checked } = event.target;
    setSectionFormState((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleSectionTypeChange(event) {
    const nextType = event.target.value;

    setSectionFormState((current) => ({
      ...current,
      type: nextType,
      items: ensureItemsForType(nextType, current.items),
      settings: {
        ...buildDefaultSettings(nextType),
        ...(current.settings || {})
      }
    }));
  }

  function handleSettingsChange(name, value) {
    setSectionFormState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [name]: value
      }
    }));
  }

  function handleBannerChange(event) {
    const { name, value, type, checked } = event.target;
    setBannerFormState((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function toggleArrayValue(fieldName, value) {
    setSectionFormState((current) => {
      const currentValues = current[fieldName];
      const exists = currentValues.includes(value);

      return {
        ...current,
        [fieldName]: exists ? currentValues.filter((item) => item !== value) : [...currentValues, value]
      };
    });
  }

  function addItem() {
    setSectionFormState((current) => ({
      ...current,
      items: current.type === 'image_text_block' ? [createEmptyItem()] : [...current.items, createEmptyItem()]
    }));
  }

  function removeItem(index) {
    setSectionFormState((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateItem(index, field, value) {
    setSectionFormState((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  async function handleSectionSubmit(event) {
    event.preventDefault();

    if (!sectionFormState.key.trim()) {
      setErrorMessage('Key section khong duoc de trong.');
      return;
    }

    try {
      setSectionSubmitting(true);
      setErrorMessage('');

      const payload = buildSectionPayload({
        ...sectionFormState,
        items: ensureItemsForType(sectionFormState.type, sectionFormState.items)
      });

      if (editingSection) {
        const response = await updateHomeSection(editingSection._id, payload, token);
        setSections((current) =>
          current
            .map((section) => (section._id === editingSection._id ? normalizeSection(response.section) : section))
            .sort((left, right) => left.order - right.order)
        );
        showToast({ title: 'Da cap nhat section homepage', type: 'success' });
      } else {
        const response = await createHomeSection(payload, token);
        setSections((current) => [...current, normalizeSection(response.section)].sort((left, right) => left.order - right.order));
        showToast({ title: 'Da tao section homepage', type: 'success' });
      }

      setIsSectionModalOpen(false);
      setEditingSection(null);
      setSectionFormState(createInitialSectionFormState());
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Khong the luu section homepage.');
      showToast({ title: 'Luu section that bai', type: 'error' });
    } finally {
      setSectionSubmitting(false);
    }
  }

  async function handleBannerSubmit(event) {
    event.preventDefault();

    if (!bannerFormState.name.trim() || !bannerFormState.imageUrl.trim()) {
      setErrorMessage('Banner can co ten va anh.');
      return;
    }

    try {
      setBannerSubmitting(true);
      setErrorMessage('');

      const payload = {
        name: bannerFormState.name.trim(),
        bannerType: bannerFormState.bannerType,
        imageUrl: bannerFormState.imageUrl.trim(),
        mobileImageUrl: bannerFormState.mobileImageUrl.trim(),
        title: bannerFormState.title.trim(),
        subtitle: bannerFormState.subtitle.trim(),
        buttonLabel: bannerFormState.buttonLabel.trim(),
        buttonLink: bannerFormState.buttonLink.trim(),
        isActive: bannerFormState.isActive
      };

      if (editingBanner) {
        const response = await updateBanner(editingBanner._id, payload, token);
        setBanners((current) => current.map((banner) => (banner._id === editingBanner._id ? response.banner : banner)));
        showToast({ title: 'Da cap nhat banner', type: 'success' });
      } else {
        const response = await createBanner(payload, token);
        setBanners((current) => [response.banner, ...current]);
        showToast({ title: 'Da tao banner', type: 'success' });
      }

      setIsBannerModalOpen(false);
      setEditingBanner(null);
      setBannerFormState(initialBannerFormState);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Khong the luu banner.');
      showToast({ title: 'Luu banner that bai', type: 'error' });
    } finally {
      setBannerSubmitting(false);
    }
  }

  async function handleQuickToggle(section) {
    try {
      const response = await updateHomeSection(section._id, { isActive: !section.isActive }, token);
      setSections((current) => current.map((item) => (item._id === section._id ? normalizeSection(response.section) : item)));
      showToast({ title: 'Da cap nhat trang thai section', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Khong the cap nhat trang thai section.');
      showToast({ title: 'Cap nhat trang thai that bai', type: 'error' });
    }
  }

  async function confirmDeleteSection() {
    if (!sectionToDelete) {
      return;
    }

    try {
      await deleteHomeSection(sectionToDelete._id, token);
      setSections((current) => current.filter((section) => section._id !== sectionToDelete._id));
      setSectionToDelete(null);
      showToast({ title: 'Da xoa section homepage', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Khong the xoa section homepage.');
      showToast({ title: 'Xoa section that bai', type: 'error' });
    }
  }

  async function confirmDeleteBanner() {
    if (!bannerToDelete) {
      return;
    }

    try {
      await deleteBanner(bannerToDelete._id, token);
      setBanners((current) => current.filter((banner) => banner._id !== bannerToDelete._id));
      setSections((current) =>
        current.map((section) => ({
          ...section,
          banners: Array.isArray(section.banners) ? section.banners.filter((banner) => banner._id !== bannerToDelete._id) : []
        }))
      );
      setBannerToDelete(null);
      showToast({ title: 'Da xoa banner', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Khong the xoa banner.');
      showToast({ title: 'Xoa banner that bai', type: 'error' });
    }
  }

  async function persistSectionOrder(nextSections) {
    try {
      const response = await reorderHomeSections(nextSections.map((section) => section._id), token);
      setSections(Array.isArray(response.sections) ? response.sections.map((section) => normalizeSection(section)) : []);
      showToast({ title: 'Da cap nhat thu tu homepage', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Khong the cap nhat thu tu section.');
      showToast({ title: 'Sap xep that bai', type: 'error' });
    }
  }

  function handleDragStart(sectionId) {
    setDraggingId(sectionId);
  }

  function handleDrop(targetId) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId('');
      return;
    }

    const currentIndex = sections.findIndex((section) => section._id === draggingId);
    const targetIndex = sections.findIndex((section) => section._id === targetId);

    if (currentIndex === -1 || targetIndex === -1) {
      setDraggingId('');
      return;
    }

    const nextSections = [...sections];
    const [movedSection] = nextSections.splice(currentIndex, 1);
    nextSections.splice(targetIndex, 0, movedSection);

    const reordered = nextSections.map((section, index) => ({
      ...section,
      order: index + 1
    }));

    setDraggingId('');
    setSections(reordered);
    persistSectionOrder(reordered);
  }

  function renderProductSelector() {
    const normalizedKeyword = productSearchKeyword.trim().toLowerCase();
    const filteredProducts = normalizedKeyword
      ? products.filter((product) =>
          [product.name, product.slug, product.category?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedKeyword))
        )
      : products;

    return (
      <div className="space-y-3">
        <p className="field-label">Chon san pham</p>
        <input
          type="search"
          value={productSearchKeyword}
          onChange={(event) => setProductSearchKeyword(event.target.value)}
          placeholder="Go ten, slug hoac danh muc san pham..."
          className="input-field"
        />
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50 p-3">
          {filteredProducts.map((product) => {
            const checked = sectionFormState.products.includes(product._id);

            return (
              <label key={product._id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleArrayValue('products', product._id)}
                  className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold"
                />
                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {product.images?.[0] ? <img src={getPublicAssetUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{product.name}</p>
                  <p className="truncate text-xs text-slate-500">{product.category?.name || product.slug}</p>
                </div>
              </label>
            );
          })}
          {!filteredProducts.length ? <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Khong tim thay san pham phu hop.</div> : null}
        </div>
        {selectedProductsPreview.length > 0 ? <p className="text-xs text-slate-500">Da chon {selectedProductsPreview.length} san pham.</p> : null}
      </div>
    );
  }

  function renderBannerSelector() {
    return (
      <div className="space-y-3">
        <p className="field-label">Chon banner</p>
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50 p-3">
          {banners.map((banner) => {
            const checked = sectionFormState.banners.includes(banner._id);

            return (
              <label key={banner._id} className="block rounded-[24px] bg-white p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArrayValue('banners', banner._id)}
                    className="mt-2 h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`${banner.bannerType === 'story' ? 'aspect-square' : 'aspect-[8/3]'} overflow-hidden rounded-2xl border border-slate-200 bg-slate-100`}>
                      <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-full w-full object-cover object-center" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-navy">{banner.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{banner.title || 'Khong co tieu de'}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{getBannerTypeMeta(banner.bannerType).label}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        {selectedBannersPreview.length > 0 ? <p className="text-xs text-slate-500">Da chon {selectedBannersPreview.length} banner.</p> : null}
      </div>
    );
  }

  function renderSectionFields() {
    switch (sectionFormState.type) {
      case 'hero_banner':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Tieu de</span>
                <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Subtitle</span>
                <input name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Label button</span>
                <input name="buttonLabel" value={sectionFormState.buttonLabel} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Link button</span>
                <input name="buttonLink" value={sectionFormState.buttonLink} onChange={handleSectionChange} className="input-field" />
              </label>
            </div>
            {renderBannerSelector()}
          </>
        );
      case 'category_grid':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Tieu de</span>
                <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Subtitle</span>
                <input name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} className="input-field" />
              </label>
            </div>
            <ItemEditor
              label="Danh sach danh muc"
              items={sectionFormState.items}
              onAdd={addItem}
              onRemove={removeItem}
              onChange={updateItem}
              fields={[
                { name: 'title', label: 'Tên danh mục' },
                { name: 'description', label: 'Mô tả', multiline: true, fullWidth: true },
                { name: 'image', label: 'Ảnh' },
                { name: 'link', label: 'Link' },
                { name: 'color', label: 'Màu nền / gradient CSS', fullWidth: true }
              ]}
            />
          </>
        );
      case 'product_slider':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Tieu de</span>
                <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Subtitle</span>
                <input name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Variant layout</span>
                <select
                  value={sectionFormState.settings.variant || 'listing'}
                  onChange={(event) => handleSettingsChange('variant', event.target.value)}
                  className="select-field"
                >
                  <option value="listing">Listing</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label>
                <span className="field-label">Nguon san pham</span>
                <select
                  value={sectionFormState.settings.sourceMode || 'manual'}
                  onChange={(event) => handleSettingsChange('sourceMode', event.target.value)}
                  className="select-field"
                >
                  <option value="manual">Chon san pham bang tay</option>
                  <option value="query">Lay theo duong dan</option>
                </select>
              </label>
            </div>
            {(sectionFormState.settings.sourceMode || 'manual') === 'query' ? (
              <label className="block">
                <span className="field-label">Duong dan lay san pham</span>
                <input
                  value={sectionFormState.settings.productQuery || '/products'}
                  onChange={(event) => handleSettingsChange('productQuery', event.target.value)}
                  className="input-field"
                  placeholder="/products?category=nhan&gender=female"
                />
                <span className="mt-2 block text-xs text-slate-500">Section se lay 8 san pham dau tien theo query nay.</span>
              </label>
            ) : (
              renderProductSelector()
            )}
          </>
        );
      case 'promo_banner':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Tieu de</span>
                <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Subtitle</span>
                <input name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Label button</span>
                <input name="buttonLabel" value={sectionFormState.buttonLabel} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Link button</span>
                <input name="buttonLink" value={sectionFormState.buttonLink} onChange={handleSectionChange} className="input-field" />
              </label>
            </div>
            {renderBannerSelector()}
          </>
        );
      case 'image_text_block':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Tieu de</span>
                <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Subtitle</span>
                <input name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} className="input-field" />
              </label>
              <label className="md:col-span-2">
                <span className="field-label">Description</span>
                <textarea name="description" value={sectionFormState.description} onChange={handleSectionChange} rows="4" className="textarea-field" />
              </label>
              <label>
                <span className="field-label">Ảnh</span>
                <input
                  value={sectionFormState.items[0]?.image || ''}
                  onChange={(event) => updateItem(0, 'image', event.target.value)}
                  className="input-field"
                />
              </label>
              <label>
                <span className="field-label">Layout</span>
                <select
                  value={sectionFormState.settings.layout || 'imageLeft'}
                  onChange={(event) => handleSettingsChange('layout', event.target.value)}
                  className="select-field"
                >
                  <option value="imageLeft">imageLeft</option>
                  <option value="imageRight">imageRight</option>
                </select>
              </label>
              <label>
                <span className="field-label">Label button</span>
                <input name="buttonLabel" value={sectionFormState.buttonLabel} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Link button</span>
                <input name="buttonLink" value={sectionFormState.buttonLink} onChange={handleSectionChange} className="input-field" />
              </label>
            </div>
          </>
        );
      case 'service_grid':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Tiêu đề</span>
                <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Subtitle</span>
                <input name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} className="input-field" />
              </label>
            </div>
            <ItemEditor
              label="Danh sach dich vu"
              items={sectionFormState.items}
              onAdd={addItem}
              onRemove={removeItem}
              onChange={updateItem}
              fields={[
                { name: 'icon', label: 'Icon / ky tu ngan' },
                { name: 'title', label: 'Tieu de' },
                { name: 'description', label: 'Mo ta', multiline: true, fullWidth: true }
              ]}
            />
          </>
        );
      case 'collection_cards':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Tieu de</span>
                <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Subtitle</span>
                <input name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} className="input-field" />
              </label>
              <label>
                <span className="field-label">Kieu card</span>
                <select
                  value={sectionFormState.settings.variant || 'standard'}
                  onChange={(event) => handleSettingsChange('variant', event.target.value)}
                  className="select-field"
                >
                  <option value="standard">Square 1:1</option>
                  <option value="editorial">Editorial 4:5</option>
                </select>
              </label>
              <label>
                <span className="field-label">Label button tong</span>
                <input name="buttonLabel" value={sectionFormState.buttonLabel} onChange={handleSectionChange} className="input-field" />
              </label>
              <label className="md:col-span-2">
                <span className="field-label">Link button tong</span>
                <input name="buttonLink" value={sectionFormState.buttonLink} onChange={handleSectionChange} className="input-field" />
              </label>
            </div>
            <ItemEditor
              label="Danh sach collection card"
              items={sectionFormState.items}
              onAdd={addItem}
              onRemove={removeItem}
              onChange={updateItem}
              fields={[
                { name: 'title', label: 'Tieu de' },
                { name: 'subtitle', label: 'Tagline' },
                { name: 'description', label: 'Mo ta', multiline: true, fullWidth: true },
                { name: 'image', label: 'Anh' },
                { name: 'link', label: 'Link' },
                { name: 'color', label: 'Mau phu' }
              ]}
            />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Homepage CMS"
        title="Quan ly homepage theo type"
        description="Moi section homepage co type ro rang. Form admin se chi hien field phu hop voi tung loai section."
        meta={loading ? 'Dang tai cau hinh...' : `${activeSections}/${sections.length} section dang hien thi`}
        actions={
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={openCreateSectionModal} className="btn-secondary">
              Them section
            </button>
            <button type="button" onClick={openCreateBannerModal} className="btn-outline">
              Them banner
            </button>
          </div>
        }
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-navy">Section homepage</p>
            <p className="mt-2 text-sm text-slate-600">Keo tha de doi thu tu. Moi section hien loai, so item va du lieu lien quan de admin de quan sat.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton-block h-28" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => {
                const typeMeta = getSectionTypeMeta(section.type);
                const normalizedSection = normalizeSection(section);

                return (
                  <article
                    key={section._id}
                    draggable
                    onDragStart={() => handleDragStart(section._id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(section._id)}
                    className={`rounded-[28px] border bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition ${
                      draggingId === section._id ? 'border-gold ring-2 ring-gold/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            #{section.order}
                          </span>
                          <span className="rounded-full bg-[#fff8e2] px-3 py-1 text-xs font-semibold text-[#9b7b18]">{typeMeta.label}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${section.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {section.isActive ? 'Dang bat' : 'Dang tat'}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-navy">{section.title || section.key}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{typeMeta.description}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>{normalizedSection.products.length} san pham</span>
                          <span>{normalizedSection.banners.length} banner</span>
                          <span>{normalizedSection.items.length} item</span>
                          <span>Key: {section.key}</span>
                        </div>
                      </div>

                      <div className="flex flex-nowrap items-center gap-2 self-start">
                        <button type="button" onClick={() => handleQuickToggle(section)} className="btn-outline shrink-0 !px-4 !py-2">
                          {section.isActive ? 'Tat' : 'Bat'}
                        </button>
                        <button type="button" onClick={() => openEditSectionModal(section)} className="btn-outline shrink-0 !px-4 !py-2">
                          Sua
                        </button>
                        <button
                          type="button"
                          onClick={() => setSectionToDelete(section)}
                          className="inline-flex shrink-0 items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Xoa
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-navy">Kho banner</p>
            <p className="mt-2 text-sm text-slate-600">Banner duoc tai dung cho hero banner va promo banner. Section khong can banner se khong hien kho nay trong form.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton-block h-44" />
              ))}
            </div>
          ) : (
            banners.map((banner) => (
              <article key={banner._id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <div className={`${banner.bannerType === 'story' ? 'aspect-square' : 'aspect-[8/3]'} bg-slate-100`}>
                  <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-full w-full object-cover object-center" />
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-navy">{banner.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{banner.title || 'Khong co tieu de banner'}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{getBannerTypeMeta(banner.bannerType).label}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${banner.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {banner.isActive ? 'Bat' : 'Tat'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEditBannerModal(banner)} className="btn-outline !px-4 !py-2">
                      Sua banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerToDelete(banner)}
                      className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Xoa
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <AdminModal
        open={isSectionModalOpen}
        title={editingSection ? 'Cap nhat section homepage' : 'Them section homepage'}
        description="Form duoc thay doi theo type de admin chi nhap dung noi dung can thiet."
        onClose={() => setIsSectionModalOpen(false)}
      >
        <form onSubmit={handleSectionSubmit} className="space-y-6">
          <div className="rounded-[24px] border border-[#ead8aa] bg-[#fffaf0] p-4">
            <p className="text-sm font-semibold text-navy">{sectionTypeMeta.label}</p>
            <p className="mt-1 text-sm text-slate-600">{sectionTypeMeta.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">Key *</span>
              <input name="key" value={sectionFormState.key} onChange={handleSectionChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Loai section *</span>
              <select name="type" value={sectionFormState.type} onChange={handleSectionTypeChange} className="select-field">
                {sectionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Thu tu hien thi</span>
              <input type="number" min="1" name="order" value={sectionFormState.order} onChange={handleSectionChange} className="input-field" />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isActive" checked={sectionFormState.isActive} onChange={handleSectionChange} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold" />
            Bat section
          </label>

          {renderSectionFields()}

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-navy">Preview nhanh</p>
            <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div>
                <span className="font-semibold text-navy">Tieu de:</span> {sectionFormState.title || 'Chua nhap'}
              </div>
              <div>
                <span className="font-semibold text-navy">Loai:</span> {sectionTypeMeta.label}
              </div>
              <div>
                <span className="font-semibold text-navy">Banner:</span> {sectionFormState.banners.length}
              </div>
              <div>
                <span className="font-semibold text-navy">San pham:</span> {sectionFormState.products.length}
              </div>
              <div>
                <span className="font-semibold text-navy">Items:</span> {sectionFormState.items.length}
              </div>
              <div>
                <span className="font-semibold text-navy">Dang bat:</span> {sectionFormState.isActive ? 'Co' : 'Khong'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsSectionModalOpen(false)} className="btn-outline">
              Huy
            </button>
            <button type="submit" disabled={sectionSubmitting} className="btn-secondary">
              {sectionSubmitting ? 'Dang luu...' : 'Luu section'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={isBannerModalOpen}
        title={editingBanner ? 'Cap nhat banner' : 'Them banner'}
        description="Banner dong duoc dung lai cho homepage."
        onClose={() => setIsBannerModalOpen(false)}
      >
        <form onSubmit={handleBannerSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Ten banner *</span>
                <input name="name" value={bannerFormState.name} onChange={handleBannerChange} className="input-field" />
              </label>
            <label>
              <span className="field-label">Loai banner</span>
              <select name="bannerType" value={bannerFormState.bannerType} onChange={handleBannerChange} className="select-field">
                {BANNER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Link button</span>
              <input name="buttonLink" value={bannerFormState.buttonLink} onChange={handleBannerChange} className="input-field" />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Anh desktop *</span>
              <input name="imageUrl" value={bannerFormState.imageUrl} onChange={handleBannerChange} className="input-field" />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Anh mobile</span>
              <input name="mobileImageUrl" value={bannerFormState.mobileImageUrl} onChange={handleBannerChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Tieu de</span>
              <input name="title" value={bannerFormState.title} onChange={handleBannerChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Label button</span>
              <input name="buttonLabel" value={bannerFormState.buttonLabel} onChange={handleBannerChange} className="input-field" />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Mo ta</span>
              <textarea name="subtitle" value={bannerFormState.subtitle} onChange={handleBannerChange} rows="3" className="textarea-field" />
            </label>
          </div>

          <div className="rounded-[24px] border border-[#ead8aa] bg-[#fffaf0] p-4">
            <p className="text-sm font-semibold text-navy">{getBannerTypeMeta(bannerFormState.bannerType).label}</p>
            <p className="mt-1 text-sm text-slate-600">{getBannerTypeMeta(bannerFormState.bannerType).description}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Hero Banner: Desktop 1920x720 (8:3), Mobile 1200x900 (4:3)</p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isActive" checked={bannerFormState.isActive} onChange={handleBannerChange} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold" />
            Bat banner
          </label>

          {bannerFormState.imageUrl ? (
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
              <div className={bannerFormState.bannerType === 'story' ? 'aspect-square' : 'aspect-[8/3]'}>
                <img src={getPublicAssetUrl(bannerFormState.imageUrl)} alt="Banner preview" className="h-full w-full object-cover object-center" />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsBannerModalOpen(false)} className="btn-outline">
              Huy
            </button>
            <button type="submit" disabled={bannerSubmitting} className="btn-secondary">
              {bannerSubmitting ? 'Dang luu...' : 'Luu banner'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        open={Boolean(sectionToDelete)}
        title="Xac nhan xoa section"
        description={sectionToDelete ? `Ban dang xoa "${sectionToDelete.title || sectionToDelete.key}". Hanh dong nay khong the hoan tac.` : ''}
        confirmLabel="Xoa section"
        onConfirm={confirmDeleteSection}
        onClose={() => setSectionToDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(bannerToDelete)}
        title="Xac nhan xoa banner"
        description={bannerToDelete ? `Ban dang xoa "${bannerToDelete.name}". Hanh dong nay khong the hoan tac.` : ''}
        confirmLabel="Xoa banner"
        onConfirm={confirmDeleteBanner}
        onClose={() => setBannerToDelete(null)}
      />
    </section>
  );
}

export default AdminHomepagePage;
