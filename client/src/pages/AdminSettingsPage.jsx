import { useEffect, useState } from 'react';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEFAULT_SITE_SETTINGS, useSiteSettings } from '../context/SiteSettingsContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getAdminSiteSettings, updateAdminSiteSettings } from '../services/api.js';

const textFields = [
  { name: 'storeName', label: 'Tên cửa hàng', placeholder: 'JewelAura' },
  { name: 'logoUrl', label: 'Logo URL', placeholder: 'https://...' },
  { name: 'hotline', label: 'Hotline', placeholder: '1900 6868' },
  { name: 'email', label: 'Email', placeholder: 'support@jewelaura.vn' },
  { name: 'address', label: 'Địa chỉ cửa hàng', placeholder: 'Nhập địa chỉ cửa hàng' },
  { name: 'facebookUrl', label: 'Link Facebook', placeholder: 'https://facebook.com/...' },
  { name: 'zaloUrl', label: 'Link Zalo', placeholder: 'https://zalo.me/...' },
  { name: 'instagramUrl', label: 'Link Instagram', placeholder: 'https://instagram.com/...' },
  { name: 'tiktokUrl', label: 'Link TikTok', placeholder: 'https://tiktok.com/@...' },
  { name: 'messengerUrl', label: 'Link Messenger', placeholder: 'https://m.me/...' },
  { name: 'googleMapUrl', label: 'Link Google Map', placeholder: 'https://maps.google.com/...' }
];

const bankFields = [
  { name: 'bankCode', label: 'Mã ngân hàng', placeholder: 'TCB' },
  { name: 'bankName', label: 'Tên ngân hàng', placeholder: 'Techcombank' },
  { name: 'bankAccountNumber', label: 'Số tài khoản', placeholder: '0349865887' },
  { name: 'bankAccountName', label: 'Tên chủ tài khoản', placeholder: 'NGUYEN DUC HA' }
];

function createForm(settings = DEFAULT_SITE_SETTINGS) {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...settings,
    topbarMessages: [
      settings.topbarMessages?.[0] || '',
      settings.topbarMessages?.[1] || '',
      settings.topbarMessages?.[2] || ''
    ]
  };
}

function AdminSettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { updateLocalSettings } = useSiteSettings();
  const [formValues, setFormValues] = useState(createForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await getAdminSiteSettings(token);

        if (isMounted) {
          setFormValues(createForm(response.settings));
          updateLocalSettings(response.settings);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'Không thể tải cài đặt website.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [token, updateLocalSettings]);

  function updateField(name, value) {
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateTopbarMessage(index, value) {
    setFormValues((current) => {
      const nextMessages = [...current.topbarMessages];
      nextMessages[index] = value;
      return {
        ...current,
        topbarMessages: nextMessages
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage('');
      const payload = {
        ...formValues,
        freeShippingThreshold: Number(formValues.freeShippingThreshold) || 0,
        topbarMessages: formValues.topbarMessages.map((item) => item.trim()).filter(Boolean).slice(0, 3)
      };
      const response = await updateAdminSiteSettings(payload, token);

      setFormValues(createForm(response.settings));
      updateLocalSettings(response.settings);
      showToast({ title: 'Đã lưu cài đặt website', type: 'success' });
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể lưu cài đặt website.';
      setErrorMessage(message);
      showToast({ title: 'Lưu cài đặt thất bại', description: message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Cài đặt"
        title="Cài đặt website"
        description="Quản lý thông tin cửa hàng, mạng xã hội, ngân hàng, topbar và chính sách dùng chung."
        meta={loading ? 'Đang tải...' : 'Thông tin cửa hàng'}
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-block h-20" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <h3 className="text-lg font-bold text-navy">Thông tin cửa hàng</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {textFields.map((field) => (
                <label key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                  <span className="field-label">{field.label}</span>
                  <input
                    value={formValues[field.name] || ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    className="input-field"
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <h3 className="text-lg font-bold text-navy">Thanh toán và vận chuyển</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {bankFields.map((field) => (
                <label key={field.name}>
                  <span className="field-label">{field.label}</span>
                  <input
                    value={formValues[field.name] || ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    className="input-field"
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
              <label>
                <span className="field-label">Ngưỡng miễn phí vận chuyển</span>
                <input
                  type="number"
                  min="0"
                  value={formValues.freeShippingThreshold || 0}
                  onChange={(event) => updateField('freeShippingThreshold', event.target.value)}
                  className="input-field"
                  placeholder="1000000"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <h3 className="text-lg font-bold text-navy">Thông báo topbar</h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {formValues.topbarMessages.map((message, index) => (
                <label key={index}>
                  <span className="field-label">Đoạn {index + 1}</span>
                  <input
                    value={message}
                    onChange={(event) => updateTopbarMessage(index, event.target.value)}
                    className="input-field"
                    placeholder={`Thông báo ${index + 1}`}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <h3 className="text-lg font-bold text-navy">Chính sách sản phẩm</h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label>
                <span className="field-label">Chính sách bảo hành</span>
                <textarea
                  rows="7"
                  value={formValues.warrantyPolicy || ''}
                  onChange={(event) => updateField('warrantyPolicy', event.target.value)}
                  className="textarea-field"
                />
              </label>
              <label>
                <span className="field-label">Hướng dẫn bảo quản</span>
                <textarea
                  rows="7"
                  value={formValues.careGuide || ''}
                  onChange={(event) => updateField('careGuide', event.target.value)}
                  className="textarea-field"
                />
              </label>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex justify-end">
            <button type="submit" disabled={saving} className="btn-secondary shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default AdminSettingsPage;
