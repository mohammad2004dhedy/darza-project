import type { PropertyDetailsResponse } from '../../../../types/api'
export function OwnerStatusNotice({ property }: { property: PropertyDetailsResponse }) {
  if (!property.postingStatus || property.postingStatus === 'APPROVED') return null
  return (
    <aside
      role="status"
      className={
        property.postingStatus === 'REJECTED'
          ? 'rounded-lg border border-danger-banner/30 bg-danger-banner/10 p-4 text-danger-banner'
          : 'rounded-lg border border-warning/30 bg-warning/20 p-4 font-bold text-text'
      }
    >
      {property.postingStatus === 'PENDING' ? (
        'الإعلان قيد المراجعة ولن يظهر للعامة حتى تتم الموافقة'
      ) : (
        <>
          تم رفض الإعلان
          {property.rejectionReason && (
            <p className="mt-2 whitespace-pre-line">{property.rejectionReason}</p>
          )}
        </>
      )}
    </aside>
  )
}
