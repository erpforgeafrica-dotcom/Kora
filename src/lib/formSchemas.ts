import type { FormSchema } from '../components/forms/DynamicForm';

export const STAFF_REGISTRATION_SCHEMA: FormSchema = {
  id:          'staff-registration',
  title:       'Add a Team Member',
  description: 'Fill in the details below to add a new staff member to your business.',
  submitLabel: 'Save Staff Profile',
  sections: [
    {
      title: 'Personal Information',
      fields: [
        { id: 'first_name',  type: 'text',  label: 'First Name',  placeholder: 'e.g. Amara',  required: true },
        { id: 'last_name',   type: 'text',  label: 'Last Name',   placeholder: 'e.g. Okafor', required: true },
        { id: 'email',       type: 'email', label: 'Email',       placeholder: 'amara@example.com', required: true },
        { id: 'phone',       type: 'phone', label: 'Phone Number',placeholder: '+234 800 000 0000' },
        { id: 'photo',       type: 'image', label: 'Profile Photo', accept: 'image/*' },
      ],
    },
    {
      title: 'Role & Access',
      fields: [
        {
          id: 'role', type: 'select', label: 'Role', required: true,
          options: [
            { label: 'Manager',     value: 'MANAGER' },
            { label: 'Staff',       value: 'STAFF' },
            { label: 'Consultant',  value: 'CONSULTANT' },
            { label: 'Specialist',  value: 'SPECIALIST' },
          ],
        },
        {
          id: 'royalty_split', type: 'number', label: 'Franchise Royalty % (CEO only)',
          placeholder: '5', hint: 'Only applies to franchise agreements.',
          visibleIf: { role: 'CEO' },  // hidden unless viewer is CEO
        },
        {
          id: 'department', type: 'text', label: 'Department', placeholder: 'e.g. Hair & Beauty',
        },
      ],
    },
    {
      title: 'Verification & Consent',
      fields: [
        { id: 'id_document', type: 'file',     label: 'Upload ID (Passport / National ID)', accept: '.pdf,image/*' },
        { id: 'biometric_consent', type: 'checkbox', label: 'Staff consents to biometric authentication (face & fingerprint)', required: true },
      ],
    },
  ],
};

export const SERVICE_CREATION_SCHEMA: FormSchema = {
  id:          'service-creation',
  title:       'Add a New Service',
  description: 'Describe what you offer so customers can find and book you.',
  submitLabel: 'Add Service',
  sections: [
    {
      title: 'Service Details',
      fields: [
        { id: 'name_en',     type: 'text',   label: 'Service Name (English)', placeholder: 'e.g. Classic Haircut', required: true },
        { id: 'name_fr',     type: 'text',   label: 'French Name (optional)', placeholder: 'e.g. Coupe Classique' },
        { id: 'description', type: 'textarea', label: 'Description', placeholder: 'Tell customers what to expect...', required: true },
        { id: 'duration',    type: 'number', label: 'Duration (minutes)', placeholder: '30', required: true },
        { id: 'price',       type: 'number', label: 'Price', placeholder: '5000', required: true },
        {
          id: 'currency', type: 'select', label: 'Currency',
          options: [
            { label: 'NGN — Nigerian Naira', value: 'NGN' },
            { label: 'USD — US Dollar',      value: 'USD' },
            { label: 'GBP — British Pound',  value: 'GBP' },
            { label: 'EUR — Euro',           value: 'EUR' },
          ],
        },
      ],
    },
    {
      title: 'Media',
      fields: [
        { id: 'cover_image', type: 'image', label: 'Service Cover Photo', accept: 'image/*' },
      ],
    },
  ],
};

export const PRODUCT_UPLOAD_SCHEMA: FormSchema = {
  id:          'product-upload',
  title:       'List a Product',
  description: 'Add a product to your store for customers to browse and buy.',
  submitLabel: 'List Product',
  sections: [
    {
      title: 'Product Information',
      fields: [
        { id: 'name_en',     type: 'text',     label: 'Product Name', placeholder: 'e.g. Argan Oil Serum', required: true },
        { id: 'sku',         type: 'text',     label: 'SKU / Barcode', placeholder: 'e.g. SKU-001' },
        { id: 'description', type: 'textarea', label: 'Description', placeholder: 'What does it do?', required: true },
        { id: 'price',       type: 'number',   label: 'Selling Price', placeholder: '3500', required: true },
        { id: 'stock_qty',   type: 'number',   label: 'Stock Quantity', placeholder: '50', required: true },
      ],
    },
    {
      title: 'Media',
      fields: [
        { id: 'product_image', type: 'image', label: 'Product Image', accept: 'image/*' },
      ],
    },
  ],
};
