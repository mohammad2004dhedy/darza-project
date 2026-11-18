import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useController, useForm } from 'react-hook-form'
import { PhoneField } from './components/form/PhoneField'
import { usePhoneInput } from './components/form/usePhoneInput'
import type { CountryCode } from './lib/phone'
function Rhf({ id }: { id: string }) {
  const { control } = useForm<{ countryCode: CountryCode; phoneNumber: string }>({
    defaultValues: { countryCode: '970', phoneNumber: '' },
  })
  const code = useController({ control, name: 'countryCode' })
  const number = useController({ control, name: 'phoneNumber' })
  const phone = usePhoneInput(
    { countryCode: code.field.value, phoneNumber: number.field.value },
    (next) => {
      if (id === 'both') code.field.onChange(next.countryCode)
      number.field.onChange(next.phoneNumber)
    },
  )
  return <div id={id}><PhoneField {...phone} countryCode={code.field.value} phoneNumber={number.field.value} /></div>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Rhf id="both" /><Rhf id="one" /></StrictMode>)
