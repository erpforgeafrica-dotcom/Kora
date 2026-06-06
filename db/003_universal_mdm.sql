-- =====================================================================================
-- Migration 003: Universal MDM (Master Data Management)
-- =====================================================================================
-- COMPLETE Industry Taxonomy for Companies & Freelancers
-- Addresses, Contacts, Persons, Organizations, Branches, Departments, Teams
-- =====================================================================================

-- =====================================================================================
-- ADDRESSES (Universal)
-- =====================================================================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('billing', 'shipping', 'registered', 'branch', 'home', 'work', 'other')),
  
  -- Address fields
  street_line1 TEXT NOT NULL,
  street_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  postal_code TEXT,
  country_code CHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
  
  -- Geolocation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_tenant ON addresses(tenant_id);
CREATE INDEX idx_addresses_country ON addresses(country_code);
CREATE INDEX idx_addresses_geolocation ON addresses(latitude, longitude);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_addresses_isolation ON addresses
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CONTACTS (Universal)
-- =====================================================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  contact_type VARCHAR(50) NOT NULL CHECK (contact_type IN ('phone', 'email', 'whatsapp', 'telegram', 'wechat', 'signal', 'skype', 'other')),
  
  contact_value TEXT NOT NULL,
  
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_value ON contacts(contact_value);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_contacts_isolation ON contacts
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- PERSONS (Master Person Table - separate from entity_graph)
-- =====================================================================================
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identity
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || COALESCE(middle_name || ' ', '') || last_name) STORED,
  
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'non_binary', 'other', 'prefer_not_to_say')),
  nationality TEXT,
  
  -- Contact
  primary_email TEXT,
  primary_phone TEXT,
  
  -- Profile
  photo_url TEXT,
  bio TEXT,
  
  -- Link to entity_graph (optional)
  entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_persons_tenant ON persons(tenant_id);
CREATE INDEX idx_persons_entity ON persons(entity_id);
CREATE INDEX idx_persons_email ON persons(primary_email);

ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_persons_isolation ON persons
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- ORGANIZATIONS (Master Organization Table - separate from tenants)
-- =====================================================================================
-- A tenant can have multiple organizations (branches, subsidiaries, etc.)
-- =====================================================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identity
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  registration_number TEXT,
  tax_id TEXT,
  
  -- Organization Type
  org_type VARCHAR(50) NOT NULL CHECK (org_type IN (
    'company',
    'freelancer',
    'ngo',
    'government',
    'educational',
    'healthcare',
    'religious',
    'other'
  )),
  
  -- Industry Classification (COMPLETE TAXONOMY)
  industry_category TEXT NOT NULL,
  industry_type TEXT,
  industry_subtype TEXT,
  
  -- Contact
  primary_email TEXT,
  primary_phone TEXT,
  website TEXT,
  
  -- Address (linked to addresses table)
  registered_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  
  -- Profile
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  
  -- Social
  social_links JSONB, -- {linkedin, twitter, facebook, instagram, etc.}
  
  -- Link to entity_graph (optional)
  entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX idx_organizations_entity ON organizations(entity_id);
CREATE INDEX idx_organizations_industry ON organizations(industry_category, industry_type, industry_subtype);
CREATE INDEX idx_organizations_type ON organizations(org_type);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_organizations_isolation ON organizations
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- COMPLETE INDUSTRY TAXONOMY
-- =====================================================================================
-- For COMPANIES (org_type = 'company')
-- =====================================================================================

COMMENT ON COLUMN organizations.industry_category IS 
'COMPLETE INDUSTRY CATEGORIES FOR COMPANIES:

1. Technology & IT
   - Software Development (Web, Mobile, Desktop, Enterprise, SaaS, Gaming, AI/ML, Blockchain)
   - IT Services (Consulting, System Integration, Cloud Services, Cybersecurity, Data Analytics, DevOps)
   - Hardware & Electronics (Manufacturing, Repair, Sales, IoT Devices)
   - Telecommunications (Internet Service Providers, Mobile Networks, VoIP, Data Centers)

2. Healthcare & Medical
   - Hospitals & Clinics (General, Specialty, Dental, Veterinary, Mental Health)
   - Medical Services (Diagnostics, Laboratories, Imaging, Home Care, Rehabilitation)
   - Pharmaceuticals (Manufacturing, Distribution, Research, Clinical Trials)
   - Medical Equipment (Manufacturing, Sales, Rental, Maintenance)
   - Health Tech (Telemedicine, Health Apps, Wearables, Medical Software)

3. Finance & Banking
   - Banking (Commercial, Investment, Retail, Digital Banking, Credit Unions)
   - Insurance (Life, Health, Property, Auto, Business, Reinsurance)
   - Investment Services (Asset Management, Wealth Management, Trading, Advisory)
   - Fintech (Payment Processing, Lending, Crypto, Personal Finance Apps)
   - Accounting Services (Auditing, Tax, Bookkeeping, Payroll, Financial Planning)

4. Education & Training
   - Schools (Primary, Secondary, High School, Special Education)
   - Higher Education (Universities, Colleges, Technical Institutes, Online Universities)
   - Training Centers (Professional Development, Language Schools, Test Prep, Skills Training)
   - EdTech (E-learning Platforms, LMS, Educational Apps, Virtual Classrooms)

5. Manufacturing & Industry
   - Automotive (Car Manufacturing, Parts, Service, Electric Vehicles)
   - Aerospace & Defense (Aircraft, Spacecraft, Defense Equipment, Drones)
   - Chemical & Petrochemical (Basic Chemicals, Specialty Chemicals, Plastics, Fertilizers)
   - Food & Beverage (Processing, Packaging, Distribution, Dairy, Meat, Bakery)
   - Textiles & Apparel (Fabric, Clothing Manufacturing, Footwear, Accessories)
   - Electronics (Consumer Electronics, Industrial Electronics, Semiconductors)
   - Machinery & Equipment (Heavy Machinery, Industrial Equipment, Tools)
   - Construction Materials (Cement, Steel, Lumber, Glass, Insulation)

6. Retail & E-commerce
   - Online Retail (Marketplaces, Direct-to-Consumer, Dropshipping, Subscription Boxes)
   - Physical Retail (Department Stores, Specialty Stores, Supermarkets, Convenience Stores)
   - Fashion & Apparel (Clothing, Footwear, Accessories, Jewelry, Luxury Goods)
   - Electronics Retail (Computers, Phones, Home Electronics, Gaming)
   - Home & Garden (Furniture, Home Decor, Appliances, Gardening Supplies)
   - Automotive Retail (Car Dealerships, Parts Stores, Accessories)

7. Real Estate & Construction
   - Real Estate Development (Residential, Commercial, Industrial, Mixed-Use)
   - Property Management (Residential, Commercial, HOA Management)
   - Real Estate Brokerage (Sales, Leasing, Investment)
   - Construction (General Contracting, Specialty Trades, Civil Engineering)
   - Architecture & Design (Architectural Services, Interior Design, Urban Planning)

8. Transportation & Logistics
   - Shipping & Freight (Ocean, Air, Land, Rail, Courier Services)
   - Warehousing (Storage, Distribution Centers, Cold Storage, Fulfillment)
   - Last-Mile Delivery (Courier, Food Delivery, Package Delivery)
   - Passenger Transport (Airlines, Buses, Trains, Taxis, Ride-sharing)
   - Vehicle Fleet Management (Rental, Leasing, Fleet Services)

9. Hospitality & Tourism
   - Hotels & Resorts (Luxury, Budget, Boutique, Extended Stay, Hostels)
   - Restaurants & Cafes (Fine Dining, Fast Food, Casual Dining, Cafes, Catering)
   - Travel & Tourism (Tour Operators, Travel Agencies, Destination Management)
   - Events & Entertainment (Event Planning, Venues, Theme Parks, Casinos)

10. Media & Entertainment
    - Broadcasting (TV, Radio, Streaming Services, Podcast Networks)
    - Film & Video Production (Movies, TV Shows, Documentaries, Corporate Videos)
    - Music (Production, Distribution, Streaming, Live Events, Publishing)
    - Publishing (Books, Magazines, Newspapers, Digital Publishing)
    - Gaming (Video Games, Mobile Games, Esports, Game Development)
    - Advertising & Marketing (Agencies, Digital Marketing, PR, Content Creation)

11. Energy & Utilities
    - Oil & Gas (Exploration, Production, Refining, Distribution)
    - Renewable Energy (Solar, Wind, Hydro, Geothermal, Biomass)
    - Electric Utilities (Generation, Transmission, Distribution)
    - Water & Waste (Water Supply, Wastewater Treatment, Waste Management, Recycling)

12. Agriculture & Food
    - Crop Production (Grains, Vegetables, Fruits, Nuts, Specialty Crops)
    - Livestock & Poultry (Cattle, Dairy, Poultry, Pigs, Aquaculture)
    - Agricultural Services (Equipment Rental, Consulting, Pest Control)
    - Food Processing (Packaged Foods, Frozen Foods, Canned Goods, Beverages)
    - AgTech (Precision Agriculture, Farm Management Software, Drones)

13. Professional Services
    - Legal Services (Law Firms, Corporate Legal, Litigation, IP Law)
    - Consulting (Management, Strategy, IT, HR, Operations)
    - Marketing & Advertising (Creative Agencies, Media Buying, SEO, Social Media)
    - Business Services (HR Outsourcing, Recruitment, Business Process Outsourcing)
    - Design Services (Graphic Design, Industrial Design, UX/UI Design)

14. Consumer Services
    - Personal Care (Salons, Spas, Beauty Services, Wellness Centers)
    - Cleaning Services (Residential, Commercial, Specialized Cleaning)
    - Repair Services (Electronics, Appliances, Automotive, Home Repair)
    - Pet Services (Veterinary, Grooming, Training, Boarding, Pet Sitting)
    - Laundry & Dry Cleaning

15. Non-Profit & Social
    - Charitable Organizations (Humanitarian, Education, Health, Environment)
    - Religious Organizations (Churches, Mosques, Temples, Religious Services)
    - Advocacy & Rights (Human Rights, Environmental, Animal Rights)
    - Community Services (Food Banks, Shelters, Community Centers)

16. Government & Public
    - Federal/National Government
    - State/Regional Government
    - Local/Municipal Government
    - Public Safety (Police, Fire, Emergency Services)
    - Infrastructure (Roads, Bridges, Public Transport)

17. Sports & Recreation
    - Professional Sports (Teams, Leagues, Venues)
    - Fitness & Gyms (Health Clubs, Personal Training, Yoga, Martial Arts)
    - Outdoor Recreation (Camping, Hiking, Water Sports, Adventure Tourism)
    - Sports Equipment (Manufacturing, Retail, Rental)

18. Legal & Compliance
    - Law Firms (Corporate, Criminal, Family, Immigration, IP)
    - Compliance Services (Regulatory, Audit, Risk Management)
    - Arbitration & Mediation

19. Research & Development
    - Scientific Research (Biotechnology, Chemistry, Physics)
    - Market Research (Consumer Insights, Data Analytics)
    - Product Development (Innovation Labs, Prototyping)

20. Other
    - Specify custom industry
';

-- =====================================================================================
-- COMPLETE FREELANCER CATEGORIES
-- =====================================================================================
-- For FREELANCERS (org_type = 'freelancer')
-- =====================================================================================

COMMENT ON COLUMN organizations.industry_type IS 
'COMPLETE FREELANCER CATEGORIES (when org_type = freelancer):

1. Technology & Programming
   - Web Development (Frontend, Backend, Full-Stack, WordPress, Shopify, WebFlow)
   - Mobile Development (iOS, Android, React Native, Flutter, Hybrid Apps)
   - Software Development (Desktop Apps, APIs, Microservices, System Software)
   - Database Development (SQL, NoSQL, Database Design, Optimization)
   - DevOps & Cloud (AWS, Azure, GCP, Docker, Kubernetes, CI/CD)
   - Cybersecurity (Penetration Testing, Security Audits, Ethical Hacking)
   - Data Science (Machine Learning, AI, Data Analysis, Python, R)
   - Blockchain (Smart Contracts, DApps, Crypto Development)
   - Game Development (Unity, Unreal Engine, Mobile Games, 3D Games)
   - QA & Testing (Manual Testing, Automation, Performance Testing)

2. Design & Creative
   - Graphic Design (Logos, Branding, Print Design, Packaging)
   - UI/UX Design (Web Design, App Design, User Research, Prototyping)
   - Illustration (Digital Art, Character Design, Editorial Illustration)
   - 3D Modeling (Product Modeling, Architecture, Character Modeling, Animation)
   - Video Editing (YouTube, Corporate, Weddings, Color Grading, Motion Graphics)
   - Animation (2D Animation, 3D Animation, Motion Design, Explainer Videos)
   - Photography (Portrait, Product, Event, Real Estate, Fashion)
   - Audio Production (Music Production, Podcast Editing, Sound Design, Mixing)

3. Writing & Content
   - Content Writing (Blog Posts, Articles, Website Content, SEO Writing)
   - Copywriting (Sales Copy, Ad Copy, Email Marketing, Landing Pages)
   - Technical Writing (Documentation, API Docs, User Manuals, White Papers)
   - Creative Writing (Fiction, Poetry, Scripts, Storytelling)
   - Editing & Proofreading (Copy Editing, Line Editing, Academic Editing)
   - Translation (Document Translation, Localization, Subtitling)
   - Ghostwriting (Books, eBooks, Memoirs, Business Books)

4. Marketing & Sales
   - Digital Marketing (SEO, SEM, PPC, Social Media Marketing)
   - Social Media Management (Content Creation, Community Management, Analytics)
   - Email Marketing (Campaigns, Automation, Newsletters)
   - Influencer Marketing (Brand Partnerships, Campaign Management)
   - Market Research (Surveys, Focus Groups, Competitor Analysis)
   - Sales (Lead Generation, Cold Calling, B2B Sales, Account Management)

5. Business & Consulting
   - Business Consulting (Strategy, Operations, Management, Growth)
   - Financial Consulting (CFO Services, Financial Planning, Investment Advice)
   - HR Consulting (Recruitment, Training, Performance Management)
   - Legal Consulting (Contract Review, Legal Research, Compliance)
   - Project Management (Agile, Scrum, PMO, Program Management)
   - Virtual Assistance (Admin Support, Scheduling, Email Management)

6. Video & Animation
   - Video Production (Corporate Videos, Commercials, Documentaries)
   - Videography (Events, Weddings, Real Estate, Corporate)
   - Animation (2D, 3D, Whiteboard, Stop Motion)
   - Motion Graphics (Title Sequences, Visual Effects, Explainer Videos)
   - Live Streaming (Events, Gaming, Webinars, Production)

7. Music & Audio
   - Music Production (Composition, Arrangement, Mixing, Mastering)
   - Voice Over (Commercials, Audiobooks, Animation, E-learning)
   - Sound Design (Games, Films, Apps, Podcasts)
   - Podcast Production (Editing, Show Notes, Distribution)
   - Audio Engineering (Recording, Mixing, Mastering, Live Sound)

8. Education & Training
   - Online Tutoring (Math, Science, Languages, Test Prep)
   - Course Creation (Video Courses, E-learning, LMS Content)
   - Corporate Training (Professional Development, Soft Skills, Leadership)
   - Language Teaching (English, Spanish, French, Mandarin, etc.)
   - Music Lessons (Piano, Guitar, Vocals, Theory)

9. Health & Wellness
   - Personal Training (Fitness Coaching, Nutrition, Weight Loss)
   - Yoga & Meditation (Classes, Workshops, Online Sessions)
   - Life Coaching (Career, Relationships, Personal Development)
   - Mental Health (Counseling, Therapy, Coaching)
   - Nutrition Consulting (Meal Planning, Dietary Advice)

10. Legal & Finance
    - Legal Services (Contract Drafting, Legal Research, Paralegal)
    - Accounting (Bookkeeping, Tax Preparation, Financial Reporting)
    - Financial Planning (Investment Advice, Retirement Planning)
    - Tax Consulting (Tax Strategy, Audit Support)

11. Administrative & Support
    - Virtual Assistant (Email, Scheduling, Data Entry, Research)
    - Customer Support (Phone, Email, Chat Support)
    - Data Entry (Spreadsheets, CRM, Database Management)
    - Transcription (Audio, Video, Legal, Medical)
    - Project Coordination (Planning, Tracking, Communication)

12. Engineering & Architecture
    - Mechanical Engineering (CAD, Product Design, Prototyping)
    - Electrical Engineering (Circuit Design, PCB Design, Embedded Systems)
    - Civil Engineering (Structural, Surveying, Infrastructure)
    - Architecture (Building Design, 3D Modeling, Rendering, CAD)
    - Industrial Design (Product Design, Prototyping, Manufacturing)

13. Lifestyle & Personal
    - Personal Chef (Meal Prep, Catering, Recipe Development)
    - Event Planning (Weddings, Corporate Events, Parties)
    - Interior Design (Residential, Commercial, Space Planning)
    - Fashion Styling (Personal Shopping, Wardrobe Consulting)
    - Travel Planning (Itinerary Design, Booking, Concierge)

14. Handyman & Trades
    - Home Repair (Plumbing, Electrical, Carpentry, Painting)
    - HVAC Services (Installation, Repair, Maintenance)
    - Landscaping (Garden Design, Lawn Care, Tree Services)
    - Cleaning Services (Residential, Commercial, Deep Cleaning)
    - Moving & Delivery (Packing, Moving, Furniture Assembly)

15. Beauty & Personal Care
    - Hair Styling (Cutting, Coloring, Extensions, Bridal)
    - Makeup Artistry (Bridal, Special Events, Editorial, Film)
    - Skincare (Facials, Treatments, Consultations)
    - Massage Therapy (Swedish, Deep Tissue, Sports, Spa)
    - Nail Services (Manicures, Pedicures, Nail Art)

16. Automotive
    - Auto Repair (Mechanical, Electrical, Diagnostics)
    - Auto Detailing (Interior, Exterior, Paint Correction)
    - Car Buying Consulting (Inspection, Negotiation)
    - Driver Services (Chauffeur, Delivery, Transportation)

17. Pet Services
    - Dog Training (Obedience, Behavior, Agility)
    - Pet Grooming (Dogs, Cats, Mobile Grooming)
    - Pet Sitting (In-Home, Overnight, Daycare)
    - Dog Walking (Daily Walks, Exercise, Socialization)

18. Real Estate
    - Real Estate Agent (Buying, Selling, Leasing)
    - Property Management (Tenant Relations, Maintenance, Rent Collection)
    - Real Estate Photography (Listing Photos, Virtual Tours, Drone)
    - Home Staging (Furniture Rental, Design, Setup)

19. Agriculture & Farming
    - Farm Management (Crop Planning, Equipment Operation)
    - Agricultural Consulting (Soil Testing, Crop Selection)
    - Livestock Management (Feeding, Health, Breeding)
    - Organic Farming (Sustainable Practices, Certification)

20. Other Freelance Services
    - Specify custom freelance service
';

-- =====================================================================================
-- BRANCHES
-- =====================================================================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identity
  branch_code TEXT UNIQUE NOT NULL,
  branch_name TEXT NOT NULL,
  
  -- Address
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  
  -- Manager
  manager_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  opened_at DATE,
  closed_at DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_branches_org ON branches(organization_id);
CREATE INDEX idx_branches_code ON branches(branch_code);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_branches_isolation ON branches
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- DEPARTMENTS
-- =====================================================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Identity
  department_code TEXT UNIQUE NOT NULL,
  department_name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchy
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Manager
  manager_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_departments_branch ON departments(branch_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_departments_isolation ON departments
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- TEAMS
-- =====================================================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Identity
  team_code TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  description TEXT,
  
  -- Team Lead
  team_lead_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_tenant ON teams(tenant_id);
CREATE INDEX idx_teams_department ON teams(department_id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_teams_isolation ON teams
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- TEAM MEMBERS (Many-to-Many relationship)
-- =====================================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  
  role VARCHAR(100), -- e.g., 'member', 'lead', 'coordinator'
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, person_id)
);

CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_person ON team_members(person_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_team_members_isolation ON team_members
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 003
-- =====================================================================================
