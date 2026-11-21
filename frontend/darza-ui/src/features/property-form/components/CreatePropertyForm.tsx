import { usePropertyWizard } from '../usePropertyWizard'
import { PropertyWizard } from './PropertyWizard'

export function CreatePropertyForm() {
  const wizard = usePropertyWizard()
  return <PropertyWizard wizard={wizard} />
}
