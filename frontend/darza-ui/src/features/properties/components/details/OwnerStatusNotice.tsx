import type { PropertyDetailsResponse } from '../../../../types/api'
export function OwnerStatusNotice({ property }: { property: PropertyDetailsResponse }) {
  if (!property.postingStatus || property.postingStatus === 'APPROVED') return null
  return (
    <aside role="status" className="rounded-lg border border-border bg-background p-4">
      {property.postingStatus === 'PENDING' ? (
        'إعلانك قيد المراجعة ولن يظهر للعامة حتى تتم الموافقة'
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
