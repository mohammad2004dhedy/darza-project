import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from '../context/auth'
import { MainLayout } from '../components/layout/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'
import { GuestRoute } from './GuestRoute'
const Home = lazy(() => import('../pages/HomePage'))
const Login = lazy(() => import('../pages/LoginPage'))
const Register = lazy(() => import('../pages/RegisterPage'))
const PropertyDetails = lazy(() => import('../pages/PropertyDetailsPage'))
const Profile = lazy(() => import('../pages/ProfilePage'))
const MyProperties = lazy(() => import('../pages/MyPropertiesPage'))
const CreateProperty = lazy(() => import('../pages/CreatePropertyPage'))
const EditProperty = lazy(() => import('../pages/EditPropertyPage'))
const Admin = lazy(() => import('../pages/AdminPage'))
const AdminLocations = lazy(() => import('../pages/AdminLocationsPage'))
const NotFound = lazy(() => import('../pages/NotFoundPage'))
const Privacy = lazy(() => import('../pages/PrivacyPage'))
const Terms = lazy(() => import('../pages/TermsPage'))
const About = lazy(() => import('../pages/AboutPage'))
const Contact = lazy(() => import('../pages/ContactPage'))
function ProfileRedirect() {
  const { userId } = useAuth()
  return <Navigate to={userId ? `/users/${userId}` : '/login'} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/users/:id" element={<Profile />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfileRedirect />} />
          <Route path="/my-properties" element={<MyProperties />} />
          <Route path="/properties/new" element={<CreateProperty />} />
          <Route path="/properties/:id/edit" element={<EditProperty />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
        </Route>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
