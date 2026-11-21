import { KeyRound, LocateFixed, Tag, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Spinner } from '../../../components/ui/Spinner'
import { controlStyles } from '../../../components/ui/controlStyles'
import { useCities, useTowns } from '../../location/hooks'
import { LocationFields } from '../../location/components/LocationFields'
import {
  getListingTypeLabel,
  getPropertyTypeLabel,
  getRentPeriodLabel,
} from '../../properties/format'
import { propertyIcons } from '../../properties/propertyIcons'
import type { PropertyType, RentPeriod } from '../../../types/api'
import type { FormValues } from '../schema'
import type { usePropertyWizard } from '../usePropertyWizard'

export type WizardController = ReturnType<typeof usePropertyWizard>
type StepProps = { wizard: WizardController }
const stepTitles = [
  'نوع الإعلان والعقار',
  'السعر',
  'المواصفات',
  'الموقع',
  'الصور',
  'العنوان والوصف',
  'مراجعة الإعلان',
]
const periods: RentPeriod[] = ['HOURLY', 'DAILY', 'MONTHLY', 'YEARLY']
const optionalBooleanOptions = [
  { value: '', label: 'غير محدد' },
  { value: 'true', label: 'نعم' },
  { value: 'false', label: 'لا' },
]

function ChoiceCard({
  selected,
  disabled,
  children,
  onClick,
}: {
  selected: boolean
  disabled?: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 p-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-text'}`}
    >
      {children}
    </button>
  )
}

function TypeStep({ wizard }: StepProps) {
  const { form } = wizard
  const values = form.watch()
  const errors = form.formState.errors
  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-3 font-semibold">نوع العقار</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(propertyIcons) as PropertyType[]).map((type) => {
            const Icon = propertyIcons[type]
            return (
              <ChoiceCard
                key={type}
                selected={values.propertyType === type}
                onClick={() =>
                  form.setValue('propertyType', type, { shouldDirty: true, shouldValidate: true })
                }
              >
                <Icon aria-hidden="true" className="size-5" />
                {getPropertyTypeLabel(type)}
              </ChoiceCard>
            )
          })}
        </div>
        {errors.propertyType && (
          <p role="alert" className="text-sm text-danger">
            {errors.propertyType.message}
          </p>
        )}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-semibold">نوع الإعلان</legend>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            selected={values.listingType === 'SELL'}
            onClick={() =>
              form.setValue('listingType', 'SELL', { shouldDirty: true, shouldValidate: true })
            }
          >
            <Tag aria-hidden="true" className="size-5" />
            للبيع
          </ChoiceCard>
          <ChoiceCard
            selected={values.listingType === 'RENT'}
            disabled={values.propertyType === 'LAND'}
            onClick={() =>
              form.setValue('listingType', 'RENT', { shouldDirty: true, shouldValidate: true })
            }
          >
            <KeyRound aria-hidden="true" className="size-5" />
            للإيجار
          </ChoiceCard>
        </div>
        {errors.listingType && (
          <p role="alert" className="text-sm text-danger">
            {errors.listingType.message}
          </p>
        )}
        {values.propertyType === 'LAND' && (
          <p className="text-sm text-text-muted">الأراضي متاحة للبيع فقط.</p>
        )}
      </fieldset>
    </div>
  )
}

function NumberField({
  wizard,
  name,
  label,
  integer = false,
  required = false,
}: StepProps & {
  name: 'price' | 'areaSize' | 'rooms' | 'bathrooms'
  label: string
  integer?: boolean
  required?: boolean
}) {
  return (
    <FormField
      label={label}
      required={required}
      error={wizard.form.formState.errors[name]?.message}
    >
      <Input
        {...wizard.registerNumber(name)}
        dir="ltr"
        inputMode={integer ? 'numeric' : 'decimal'}
      />
    </FormField>
  )
}

function PriceStep({ wizard }: StepProps) {
  const { form } = wizard
  return (
    <div className="space-y-5">
      <NumberField wizard={wizard} name="price" label="السعر" required />
      <fieldset>
        <legend className="mb-3 font-semibold">
          العملة <span className="text-danger">*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          {(['ILS', 'JOD', 'USD'] as const).map((currency) => (
            <ChoiceCard
              key={currency}
              selected={form.watch('currency') === currency}
              onClick={() =>
                form.setValue('currency', currency, { shouldDirty: true, shouldValidate: true })
              }
            >
              {currency}
            </ChoiceCard>
          ))}
        </div>
        {form.formState.errors.currency && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {form.formState.errors.currency.message}
          </p>
        )}
      </fieldset>
      {form.watch('listingType') === 'RENT' && (
        <FormField label="فترة الإيجار" required error={form.formState.errors.rentPeriod?.message}>
          <Select
            {...form.register('rentPeriod')}
            placeholder="اختر فترة الإيجار"
            options={periods.map((value) => ({ value, label: getRentPeriodLabel(value) }))}
          />
        </FormField>
      )}
    </div>
  )
}

function SpecificationsStep({ wizard }: StepProps) {
  const { form } = wizard
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted">جميع المواصفات اختيارية.</p>
      <NumberField wizard={wizard} name="areaSize" label="المساحة (م²)" />
      {form.watch('propertyType') !== 'LAND' && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField wizard={wizard} name="rooms" label="عدد الغرف" integer />
            <NumberField wizard={wizard} name="bathrooms" label="عدد الحمامات" integer />
          </div>
          <FormField label="مفروش" error={form.formState.errors.furnished?.message}>
            <Select {...form.register('furnished')} options={optionalBooleanOptions} />
          </FormField>
          <FormField label="شرفة" error={form.formState.errors.hasBalcony?.message}>
            <Select {...form.register('hasBalcony')} options={optionalBooleanOptions} />
          </FormField>
        </>
      )}
    </div>
  )
}

function LocationStep({ wizard }: StepProps) {
  const { form } = wizard
  const latitude = form.watch('latitude')
  const longitude = form.watch('longitude')
  return (
    <div className="space-y-5">
      <LocationFields
        cityId={form.watch('cityId')}
        city={form.register('cityId')}
        town={form.register('townId')}
        cityError={form.formState.errors.cityId?.message}
        townError={form.formState.errors.townId?.message}
      />
      <FormField label="العنوان (اختياري)" error={form.formState.errors.address?.message}>
        <Input {...form.register('address')} maxLength={150} />
      </FormField>
      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm text-text-muted">تحديد الموقع الجغرافي اختياري.</p>
        <Button type="button" variant="outline" loading={wizard.locating} onClick={wizard.locate}>
          <LocateFixed aria-hidden="true" className="size-5" />
          استخدم موقعي الحالي
        </Button>
        {latitude && longitude && (
          <div className="space-y-2">
            <p>
              الإحداثيات المحفوظة:{' '}
              <bdi dir="ltr">
                {latitude}, {longitude}
              </bdi>
            </p>
            <Button type="button" variant="ghost" onClick={wizard.clearLocation}>
              مسح الموقع
            </Button>
          </div>
        )}
        {wizard.locationError && (
          <p role="alert" className="text-sm text-danger">
            {wizard.locationError}
          </p>
        )}
        {form.formState.errors.latitude && (
          <p role="alert" className="text-sm text-danger">
            {form.formState.errors.latitude.message}
          </p>
        )}
        {form.formState.errors.longitude && (
          <p role="alert" className="text-sm text-danger">
            {form.formState.errors.longitude.message}
          </p>
        )}
      </div>
    </div>
  )
}

function ImagesStep({ wizard }: StepProps) {
  const { uploader } = wizard
  return (
    <div className="space-y-4">
      <p className="flex justify-between">
        <span>الصورة الأولى هي صورة الغلاف</span>
        <bdi dir="ltr">{uploader.items.length} / 8</bdi>
      </p>
      <FormField
        label="إضافة صور"
        required
        error={wizard.form.formState.errors.imagePaths?.message}
        hint="حتى 8 صور. يتم ضغط الصور تلقائياً إلى WebP."
      >
        <Input
          type="file"
          accept="image/*"
          multiple
          disabled={uploader.items.length >= 8 || uploader.isUploading}
          onChange={(event) => {
            if (event.target.files) void uploader.addFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {uploader.items.map((image, index) => (
          <div
            key={image.id}
            className="relative overflow-hidden rounded-lg border border-border bg-background"
          >
            <div className="flex aspect-square items-center justify-center">
              {image.url && (
                <img
                  src={image.url}
                  alt={`صورة العقار ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
              {(image.status === 'processing' || image.status === 'uploading') && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
                  <Spinner
                    label={image.status === 'processing' ? 'جاري تجهيز الصورة' : 'جاري رفع الصورة'}
                  />
                </div>
              )}
            </div>
            {index === 0 && (
              <span className="absolute start-2 top-2 rounded bg-surface px-2 py-1 text-xs font-semibold">
                الغلاف
              </span>
            )}
            <button
              type="button"
              aria-label={`حذف الصورة ${index + 1}`}
              disabled={uploader.isUploading}
              onClick={() => uploader.removeImage(image.id)}
              className="absolute end-1 top-1 flex size-11 items-center justify-center rounded-full bg-surface text-danger disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <p className="p-2 text-sm">
              {image.status === 'done'
                ? 'تم الرفع'
                : image.status === 'failed'
                  ? 'تعذّر تجهيز أو رفع الصورة'
                  : image.status === 'processing'
                    ? 'جاري التجهيز'
                    : image.status === 'uploading'
                      ? 'جاري الرفع'
                      : 'جاهزة للرفع'}
            </p>
            {image.error && (
              <p role="alert" className="px-2 pb-2 text-sm text-danger">
                {image.error}
              </p>
            )}
          </div>
        ))}
      </div>
      {uploader.error && (
        <p role="alert" className="text-sm text-danger">
          {uploader.error}
        </p>
      )}
    </div>
  )
}

function DescriptionStep({ wizard }: StepProps) {
  const { form } = wizard
  return (
    <div className="space-y-5">
      <FormField
        label="عنوان الإعلان"
        required
        error={form.formState.errors.title?.message}
        hint={`${form.watch('title').length} / 150`}
      >
        <Input {...form.register('title')} maxLength={150} />
      </FormField>
      <FormField
        label="الوصف (اختياري)"
        error={form.formState.errors.description?.message}
        hint={`${form.watch('description').length} / 2000`}
      >
        <textarea
          {...form.register('description')}
          maxLength={2000}
          rows={6}
          className={controlStyles}
        />
      </FormField>
    </div>
  )
}

function ReviewSection({
  title,
  step,
  wizard,
  children,
}: StepProps & { title: string; step: number; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          onClick={() => wizard.setStep(step)}
          aria-label={`تعديل ${title}`}
        >
          تعديل
        </Button>
      </div>
      {children}
    </section>
  )
}

function OptionalValue({ value }: { value: string | undefined }) {
  return <bdi>{value === 'true' ? 'نعم' : value === 'false' ? 'لا' : value || 'غير محدد'}</bdi>
}

function LocationSummary({ values }: { values: FormValues }) {
  const cities = useCities()
  const towns = useTowns(values.cityId ? Number(values.cityId) : undefined)
  return (
    <p>
      {cities.data?.find((city) => String(city.id) === values.cityId)?.name || 'المدينة المختارة'}،{' '}
      {towns.data?.find((town) => String(town.id) === values.townId)?.name || 'البلدة المختارة'}
    </p>
  )
}

function ReviewStep({ wizard }: StepProps) {
  const values: FormValues = wizard.form.watch()
  return (
    <div className="space-y-4">
      <ReviewSection title={stepTitles[0]} step={0} wizard={wizard}>
        <p>
          {values.propertyType && getPropertyTypeLabel(values.propertyType)} —{' '}
          {values.listingType && getListingTypeLabel(values.listingType)}
        </p>
      </ReviewSection>
      <ReviewSection title={stepTitles[1]} step={1} wizard={wizard}>
        <p>
          <bdi dir="ltr">
            {values.price} {values.currency}
          </bdi>
          {values.listingType === 'RENT' &&
            values.rentPeriod &&
            ` / ${getRentPeriodLabel(values.rentPeriod)}`}
        </p>
      </ReviewSection>
      <ReviewSection title={stepTitles[2]} step={2} wizard={wizard}>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt>المساحة (م²)</dt>
          <dd>
            <OptionalValue value={values.areaSize} />
          </dd>
          {values.propertyType !== 'LAND' && (
            <>
              <dt>الغرف</dt>
              <dd>
                <OptionalValue value={values.rooms} />
              </dd>
              <dt>الحمامات</dt>
              <dd>
                <OptionalValue value={values.bathrooms} />
              </dd>
              <dt>مفروش</dt>
              <dd>
                <OptionalValue value={values.furnished} />
              </dd>
              <dt>شرفة</dt>
              <dd>
                <OptionalValue value={values.hasBalcony} />
              </dd>
            </>
          )}
        </dl>
      </ReviewSection>
      <ReviewSection title={stepTitles[3]} step={3} wizard={wizard}>
        <LocationSummary values={values} />
        {values.address && <p>{values.address}</p>}
        {values.latitude && values.longitude && (
          <p>
            <bdi dir="ltr">
              {values.latitude}, {values.longitude}
            </bdi>
          </p>
        )}
      </ReviewSection>
      <ReviewSection title={stepTitles[4]} step={4} wizard={wizard}>
        <div className="grid grid-cols-4 gap-2">
          {wizard.uploader.items.map((image, index) => (
            <img
              key={image.id}
              src={image.url}
              alt={`صورة العقار ${index + 1}`}
              className="aspect-square w-full rounded object-cover"
            />
          ))}
        </div>
      </ReviewSection>
      <ReviewSection title={stepTitles[5]} step={5} wizard={wizard}>
        <h3 className="font-semibold">{values.title}</h3>
        <p className="whitespace-pre-wrap break-words">{values.description || 'لا يوجد وصف'}</p>
      </ReviewSection>
    </div>
  )
}

const steps = [
  TypeStep,
  PriceStep,
  SpecificationsStep,
  LocationStep,
  ImagesStep,
  DescriptionStep,
  ReviewStep,
]

export function PropertyWizard({ wizard }: StepProps) {
  const Step = steps[wizard.step]
  return (
    <form noValidate onSubmit={wizard.onSubmit} className="mx-auto max-w-2xl space-y-6 pb-28">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold">إضافة إعلان</h1>
        <p className="text-sm text-text-muted">الخطوة {wizard.step + 1} من 7</p>
        <div className="flex gap-1" aria-hidden="true">
          {stepTitles.map((title, index) => (
            <span
              key={title}
              className={`h-2 flex-1 rounded ${index <= wizard.step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
        <h2 className="text-xl font-semibold">{stepTitles[wizard.step]}</h2>
      </header>
      <fieldset disabled={wizard.busy} className="min-w-0">
        <Step wizard={wizard} />
      </fieldset>
      {wizard.formError && (
        <p role="alert" className="rounded-lg border border-danger bg-danger/10 p-4 text-danger">
          {wizard.formError}
        </p>
      )}
      {wizard.busy && (
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p>
            جاري حفظ الإعلان — الصور:{' '}
            <bdi dir="ltr">
              {wizard.uploader.progress.completed} / {wizard.uploader.progress.total}
            </bdi>
          </p>
        </div>
      )}
      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-0 z-10 flex gap-3 rounded-lg border border-border bg-surface p-3">
        {wizard.step > 0 && (
          <Button type="button" variant="outline" disabled={wizard.busy} onClick={wizard.back}>
            السابق
          </Button>
        )}
        {wizard.step < 6 ? (
          <Button
            type="button"
            fullWidth
            disabled={wizard.busy || wizard.uploader.isProcessing}
            onClick={() => void wizard.next()}
          >
            التالي
          </Button>
        ) : (
          <Button
            type="submit"
            fullWidth
            loading={wizard.busy}
            disabled={wizard.uploader.isProcessing}
          >
            إرسال الإعلان
          </Button>
        )}
      </div>
    </form>
  )
}
