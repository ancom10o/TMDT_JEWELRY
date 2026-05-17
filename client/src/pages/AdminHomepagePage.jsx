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

const sectionTypeOptions = [
  { value: 'banner_slider', label: 'Banner slider' },
  { value: 'category_grid', label: 'Grid danh muc' },
  { value: 'product_carousel', label: 'Carousel san pham' },
  { value: 'editorial_grid', label: 'Editorial grid' },
  { value: 'service_grid', label: 'Grid dich vu' }
];

const initialSectionFormState = {
  key: '',
  type: 'product_carousel',
  title: '',
  subtitle: '',
  buttonLabel: '',
  buttonLink: '/products',
  isActive: true,
  displayMode: 'listing',
  productIds: [],
  bannerIds: []
};

const initialBannerFormState = {
  name: '',
  imageUrl: '',
  mobileImageUrl: '',
  title: '',
  subtitle: '',
  buttonLabel: '',
  buttonLink: '/products',
  isActive: true
};

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
  return {
    key: section.key || '',
    type: section.type || 'product_carousel',
    title: section.title || '',
    subtitle: section.subtitle || '',
    buttonLabel: section.buttonLabel || '',
    buttonLink: section.buttonLink || '/products',
    isActive: Boolean(section.isActive),
    displayMode: section.displayMode || 'listing',
    productIds: Array.isArray(section.productIds) ? section.productIds.map((product) => product._id || product) : [],
    bannerIds: Array.isArray(section.bannerIds) ? section.bannerIds.map((banner) => banner._id || banner) : []
  };
}

function buildBannerFormState(banner) {
  return {
    name: banner.name || '',
    imageUrl: banner.imageUrl || '',
    mobileImageUrl: banner.mobileImageUrl || '',
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    buttonLabel: banner.buttonLabel || '',
    buttonLink: banner.buttonLink || '/products',
    isActive: Boolean(banner.isActive)
  };
}

function getSectionTypeLabel(type) {
  return sectionTypeOptions.find((option) => option.value === type)?.label || type;
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
  const [sectionFormState, setSectionFormState] = useState(initialSectionFormState);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionSubmitting, setSectionSubmitting] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerFormState, setBannerFormState] = useState(initialBannerFormState);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerSubmitting, setBannerSubmitting] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  const activeSections = useMemo(() => sections.filter((section) => section.isActive).length, [sections]);

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

        setSections(response.sections || []);
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
    setSectionFormState({
      ...initialSectionFormState,
      key: `section-${sections.length + 1}`
    });
    setIsSectionModalOpen(true);
  }

  function openEditSectionModal(section) {
    setEditingSection(section);
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

  function handleBannerChange(event) {
    const { name, value, type, checked } = event.target;
    setBannerFormState((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function toggleArrayValue(fieldName, value) {
    setSectionFormState((current) => {
      const exists = current[fieldName].includes(value);

      return {
        ...current,
        [fieldName]: exists ? current[fieldName].filter((item) => item !== value) : [...current[fieldName], value]
      };
    });
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

      const payload = {
        key: normalizeSlug(sectionFormState.key),
        type: sectionFormState.type,
        title: sectionFormState.title.trim(),
        subtitle: sectionFormState.subtitle.trim(),
        buttonLabel: sectionFormState.buttonLabel.trim(),
        buttonLink: sectionFormState.buttonLink.trim(),
        isActive: sectionFormState.isActive,
        displayMode: sectionFormState.displayMode,
        productIds: sectionFormState.productIds,
        bannerIds: sectionFormState.bannerIds,
        order: editingSection ? editingSection.order : sections.length + 1
      };

      if (editingSection) {
        const response = await updateHomeSection(editingSection._id, payload, token);
        setSections((current) => current.map((section) => (section._id === editingSection._id ? response.section : section)));
        showToast({ title: 'Da cap nhat section homepage', type: 'success' });
      } else {
        const response = await createHomeSection(payload, token);
        setSections((current) => [...current, response.section].sort((left, right) => left.order - right.order));
        showToast({ title: 'Da tao section homepage', type: 'success' });
      }

      setIsSectionModalOpen(false);
      setEditingSection(null);
      setSectionFormState(initialSectionFormState);
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
        setSections((current) =>
          current.map((section) => ({
            ...section,
            bannerIds: Array.isArray(section.bannerIds)
              ? section.bannerIds.map((banner) => (banner._id === editingBanner._id ? response.banner : banner))
              : []
          }))
        );
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
      setSections((current) => current.map((item) => (item._id === section._id ? response.section : item)));
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
          bannerIds: Array.isArray(section.bannerIds)
            ? section.bannerIds.filter((banner) => banner._id !== bannerToDelete._id)
            : []
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
      setSections(response.sections || []);
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

    setDraggingId('');
    setSections(
      nextSections.map((section, index) => ({
        ...section,
        order: index + 1
      }))
    );
    persistSectionOrder(nextSections);
  }

  const selectedProductsPreview = products.filter((product) => sectionFormState.productIds.includes(product._id));
  const selectedBannersPreview = banners.filter((banner) => sectionFormState.bannerIds.includes(banner._id));

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Homepage CMS"
        title="Quan ly homepage dong"
        description="Admin co the bat tat section, sua title subtitle button, chon san pham, doi banner va keo tha thu tu section ma khong can sua code."
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
            <p className="mt-2 text-sm text-slate-600">Keo tha de doi thu tu. Sau khi tha, du lieu se duoc luu ngay.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton-block h-28" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
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
                        <span className="rounded-full bg-[#fff8e2] px-3 py-1 text-xs font-semibold text-[#9b7b18]">
                          {getSectionTypeLabel(section.type)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${section.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {section.isActive ? 'Dang bat' : 'Dang tat'}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-navy">{section.title || section.key}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{section.subtitle || 'Chua co mo ta cho section nay.'}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>{section.productIds?.length || 0} san pham</span>
                        <span>{section.bannerIds?.length || 0} banner</span>
                        <span>Key: {section.key}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleQuickToggle(section)} className="btn-outline !px-4 !py-2">
                        {section.isActive ? 'Tat' : 'Bat'}
                      </button>
                      <button type="button" onClick={() => openEditSectionModal(section)} className="btn-outline !px-4 !py-2">
                        Sua
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionToDelete(section)}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Xoa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-navy">Kho banner</p>
            <p className="mt-2 text-sm text-slate-600">Preview banner ngay trong admin de kiem tra truoc khi gan vao homepage.</p>
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
                <div className="aspect-[16/8] bg-slate-100">
                  <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-navy">{banner.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{banner.title || 'Khong co tieu de banner'}</p>
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
        description="Cau hinh noi dung, banner va san pham cho section."
        onClose={() => setIsSectionModalOpen(false)}
      >
        <form onSubmit={handleSectionSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">Key *</span>
              <input name="key" value={sectionFormState.key} onChange={handleSectionChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Loai section *</span>
              <select name="type" value={sectionFormState.type} onChange={handleSectionChange} className="select-field">
                {sectionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Tieu de</span>
              <input name="title" value={sectionFormState.title} onChange={handleSectionChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Kieu hien thi</span>
              <select name="displayMode" value={sectionFormState.displayMode} onChange={handleSectionChange} className="select-field">
                <option value="listing">Listing</option>
                <option value="compact">Compact</option>
                <option value="hero">Hero</option>
                <option value="default">Default</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Mo ta</span>
              <textarea name="subtitle" value={sectionFormState.subtitle} onChange={handleSectionChange} rows="3" className="textarea-field" />
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

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isActive" checked={sectionFormState.isActive} onChange={handleSectionChange} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold" />
            Bat section
          </label>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-3">
              <p className="field-label">Chon san pham hien thi</p>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                {products.map((product) => {
                  const checked = sectionFormState.productIds.includes(product._id);

                  return (
                    <label key={product._id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArrayValue('productIds', product._id)}
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
              </div>
              {selectedProductsPreview.length > 0 ? <p className="text-xs text-slate-500">Da chon {selectedProductsPreview.length} san pham.</p> : null}
            </div>

            <div className="space-y-3">
              <p className="field-label">Chon banner</p>
              <div className="max-h-80 space-y-3 overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                {banners.map((banner) => {
                  const checked = sectionFormState.bannerIds.includes(banner._id);

                  return (
                    <label key={banner._id} className="block rounded-[24px] bg-white p-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArrayValue('bannerIds', banner._id)}
                          className="mt-2 h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-28 w-full object-cover" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-navy">{banner.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{banner.title || 'Khong co tieu de'}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {selectedBannersPreview.length > 0 ? <p className="text-xs text-slate-500">Da chon {selectedBannersPreview.length} banner.</p> : null}
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

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isActive" checked={bannerFormState.isActive} onChange={handleBannerChange} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold" />
            Bat banner
          </label>

          {bannerFormState.imageUrl ? (
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
              <img src={getPublicAssetUrl(bannerFormState.imageUrl)} alt="Banner preview" className="h-52 w-full object-cover" />
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
