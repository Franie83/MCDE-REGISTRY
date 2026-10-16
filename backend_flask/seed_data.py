"""
Edo State Ministry of Communication & Digital Economy
Central Correspondence & Document Registry

Sample seed data — used by:
  - db_utils.reseed_database()   (manual reseed via admin.py)
  - app.py init_db()             (first-boot auto-seed, optional)

Everything here is plain Python dicts. No ORM imports, no Flask imports.
Safe to edit by hand — add your own letters or folders if you want them
in every fresh seed.
"""

# ─────────────────────────────────────────────────────────────────────
# Default users (created by app.py on first boot; admin.py can reset them)
# ─────────────────────────────────────────────────────────────────────
SEED_PASSWORD = "ChangeMe!2026"
MUST_CHANGE_PASSWORD = False  # set to True to force first-login reset

SEED_USERS = [
    {
        "username": "superadmin",
        "full_name": "System Administrator",
        "email": "superadmin@mocde.edostate.gov.ng",
        "role": "super_admin",
        "directorate": None,
    },
    {
        "username": "hc",
        "full_name": "Honourable Commissioner",
        "email": "commissioner@mocde.edostate.gov.ng",
        "role": "hc",
        "directorate": None,
    },
    {
        "username": "ps",
        "full_name": "Permanent Secretary",
        "email": "ps@mocde.edostate.gov.ng",
        "role": "ps",
        "directorate": None,
    },
    {
        "username": "director",
        "full_name": "Director",
        "email": "director@mocde.edostate.gov.ng",
        "role": "director",
        "directorate": "ICT Infrastructure & Broadband",
    },
    {
        "username": "staff",
        "full_name": "Registry Staff",
        "email": "staff@mocde.edostate.gov.ng",
        "role": "staff",
        "directorate": None,
    },
]


# ─────────────────────────────────────────────────────────────────────
# Default directorates (used by the CMS settings row)
# ─────────────────────────────────────────────────────────────────────
SEED_DIRECTORATES = [
    "ICT Infrastructure & Broadband",
    "Digital Economy & Innovation",
    "e-Governance & Software Solutions",
    "Administration & Supplies",
    "Finance & Accounts",
    "Public Service e-Gov",
]


# ─────────────────────────────────────────────────────────────────────
# CMS defaults
# ─────────────────────────────────────────────────────────────────────
SEED_CMS = {
    "state_name": "Edo State Government of Nigeria",
    "mda_name": "Ministry of Communication and Digital Economy",
    "department": "Central Registry & Archival Records Directorate",
    "address": "Block C, Edo State Secretariat Complex, Sapele Road, Benin City, Edo State",
    "inward_prefix": "EDSG/MOCDE/INW",
    "outward_prefix": "EDSG/MOCDE/OUT",
    "current_year": "2026",
    "official_email": "registry@mocde.edostate.gov.ng",
    "official_phone": "+234 800 336 6623",
    "active_officer_name": "Osamwonyi E.",
    "active_officer_role": "Central Registry Supervisor",
    "banner_notice": (
        "Mandatory Compliance: All inter-departmental letters and memos must be "
        "recorded in the digital registry with assigned folder jackets."
    ),
    "directorates": SEED_DIRECTORATES,
    "storage_locations": [
        "Central Registry Cabinet 1, Shelf A",
        "Central Registry Cabinet 1, Shelf B",
        "Central Registry Room, Cabinet 2, Shelf B, Box 14",
        "Digital Economy Filing Cabinet 2, Jacket #15",
        "Permanent Secretary Archive Vault, Jacket #02",
        "Administration Registry, Shelf 2, Jacket #03",
        "ICT Directorate Filing Cabinet, Shelf C",
    ],
    "categories": [
        "Broadband Infrastructure",
        "Digital Economy & Innovation",
        "e-Governance & Software Solutions",
        "Public Service Administration",
        "Administration & Supplies",
        "Finance & Accounts",
        "Legal & Compliance",
        "General Correspondence",
    ],
    "officers": [
        "Hon. Commissioner, MOCDE",
        "Permanent Secretary, MOCDE",
        "Director, ICT Infrastructure & Broadband",
        "Director, Digital Economy & Innovation",
        "Director, e-Governance & Software Solutions",
        "Director, Administration & Supplies",
        "Director, Finance & Accounts",
        "Lead Coordinator, Edo Innovates Hub",
        "Central Registry Supervisor",
        "Senior Clerical Officer",
    ],
}


# ─────────────────────────────────────────────────────────────────────
# Sample archive folders (created BEFORE correspondence so FK links resolve)
# ─────────────────────────────────────────────────────────────────────
SEED_FOLDERS = [
    {
        "id": "folder-001",
        "name": "GovNet Fiber Broadband Expansion (18 LGAs)",
        "folder_code": "EDSG/MOCDE/INFRA/2026/008",
        "department": "ICT Infrastructure & Broadband",
        "description": "All ministerial memos, route surveys, vendor contracts, and governor approvals for the state fiber network rollout.",
        "physical_location": "Central Registry Cabinet 1, Shelf A",
        "color_tag": "emerald",
        "files": [
            {
                "id": "file-001-1",
                "name": "Executive_Directive_GovNet_18_LGA_Expansion.pdf",
                "size": 420000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/executive-directive-govnet.pdf",
                "cloudinary_public_id": "seed_placeholder_executive_directive",
                "notes": "Executive approval for Phase II inter-council network linking 18 LGAs.",
                "correspondence_id": "corr-001",
                "correspondence_ref": "EDSG/MOCDE/INW/2026/0014",
                "preview_content": (
                    "GOVERNMENT OF EDO STATE OF NIGERIA\n"
                    "OFFICE OF THE EXECUTIVE GOVERNOR\n"
                    "GOVERNMENT HOUSE, BENIN CITY\n\n"
                    "Ref: GH/ED/SEC/2026/094\n"
                    "Date: 10th October, 2026\n\n"
                    "The Honourable Commissioner,\n"
                    "Ministry of Communication and Digital Economy,\n"
                    "Secretariat Complex, Sapele Road, Benin City.\n\n"
                    "SUBJECT: EXECUTIVE DIRECTIVE ON 18 LGA BROADBAND EXPANSION\n\n"
                    "1.0 Approval has been granted for the accelerated Phase II rollout of "
                    "the Edo State Government Enterprise Network (Edo GovNet).\n"
                    "2.0 The scope involves interconnecting all 18 LGA Council Secretariats "
                    "to the State Central Datacenter in Benin City with 48-core Single Mode "
                    "optical fiber.\n"
                    "3.0 A bi-weekly milestone report must be furnished to the Governor's "
                    "Delivery Unit."
                ),
            },
            {
                "id": "file-001-2",
                "name": "LGA_Secretariat_Fiber_Route_Survey_Map.pdf",
                "size": 1480000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/fiber-route-survey.pdf",
                "cloudinary_public_id": "seed_placeholder_fiber_route",
                "notes": "Geospatial coordinates and trenching depth specifications for Benin - Ekpoma - Auchi corridors.",
                "correspondence_id": "corr-001",
                "correspondence_ref": "EDSG/MOCDE/INW/2026/0014",
                "preview_content": (
                    "EDO BROADBAND INFRASTRUCTURE SURVEY REPORT\n"
                    "Document Ref: EDSG-MOCDE-TECH-2026-04\n"
                    "Total Kilometers Mapped: 780 km Fiber Route\n"
                    "Phase 1 Complete: 240 km (Benin Metro Ring)\n"
                    "Phase 2 Planned: 540 km (Inter-LGA Highway Arterials)\n\n"
                    "Corridor Specifications:\n"
                    "- Benin to Ekpoma (Esan West): 84km\n"
                    "- Ekpoma to Auchi (Etsako West): 48km\n"
                    "- Auchi to Igarra (Akoko Edo): 36km"
                ),
            },
            {
                "id": "file-001-3",
                "name": "EDOGIS_Transmittal_Letter_Ring_Road_Fiber.pdf",
                "size": 290000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/edogis-transmittal.pdf",
                "cloudinary_public_id": "seed_placeholder_edogis",
                "notes": "Notice delivered to EDOGIS regarding underground duct locations.",
                "correspondence_id": "corr-005",
                "correspondence_ref": "EDSG/MOCDE/OUT/2026/0010",
                "preview_content": (
                    "TRANSMITTAL TO EDOGIS - FIBER DUCT PRESERVATION\n"
                    "To: Managing Director, EDOGIS, Benin City.\n"
                    "From: Director, ICT Infrastructure & Broadband.\n"
                    "Date: 15th October, 2026.\n\n"
                    "We enclose the exact geo-coordinates of ducts along Ring Road and "
                    "Airport Road. Please mandate that civil construction permits account "
                    "for these assets."
                ),
            },
        ],
    },
    {
        "id": "folder-002",
        "name": "Edo Innovates & Digital Youth Skills (NITDA Partnership)",
        "folder_code": "EDSG/MOCDE/DIG/2026/015",
        "department": "Digital Economy & Innovation",
        "description": "Dossier for regional tech hub expansion in Ekpoma and Auchi, grant proposals, and NITDA digital literacy partnerships.",
        "physical_location": "Digital Economy Filing Cabinet 2, Jacket #15",
        "color_tag": "blue",
        "files": [
            {
                "id": "file-002-1",
                "name": "NITDA_Partnership_Letter_MOCDE_Signed.pdf",
                "size": 310000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/nitda-partnership.pdf",
                "cloudinary_public_id": "seed_placeholder_nitda",
                "notes": "Signed partnership request seeking 250 workstations and AI curriculum licenses.",
                "correspondence_id": "corr-002",
                "correspondence_ref": "EDSG/MOCDE/OUT/2026/0009",
                "preview_content": (
                    "MINISTRY OF COMMUNICATION AND DIGITAL ECONOMY\n"
                    "EDO STATE GOVERNMENT\n"
                    "Block C, Secretariat Complex, Sapele Road, Benin City\n\n"
                    "Ref: EDSG/MOCDE/DIG/2026/015/VOL.I/28\n"
                    "Date: 14th October, 2026\n\n"
                    "The Director General, NITDA, Abuja.\n\n"
                    "Subject: Strategic Partnership on Digital Literacy & AI Capacity "
                    "Building for Edo Innovates Centres (Benin, Ekpoma, Auchi)."
                ),
            },
            {
                "id": "file-002-2",
                "name": "Edo_Innovates_Expansion_Framework_Benin_Ekpoma_Auchi.pdf",
                "size": 960000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/edo-innovates-framework.pdf",
                "cloudinary_public_id": "seed_placeholder_edo_innovates",
                "notes": "Program curriculum, hardware needs, and expected youth enrollment targets.",
                "correspondence_id": "corr-002",
                "correspondence_ref": "EDSG/MOCDE/OUT/2026/0009",
                "preview_content": (
                    "EDO INNOVATES EXPANSION BLUEPRINT (2026-2028)\n"
                    "- Target: 15,000 youth certified in high-demand software engineering "
                    "& AI skills annually.\n"
                    "- Locations: Wire Road Hub (Benin), AAU Tech Cluster (Ekpoma), "
                    "Polytechnic Hub (Auchi)."
                ),
            },
        ],
    },
    {
        "id": "folder-003",
        "name": "Edo State Enterprise Content Management (ECM) Rollout",
        "folder_code": "EDSG/MOCDE/ADM/CIR/2026/002",
        "department": "Administration & Public Service e-Gov",
        "description": "Service-wide policy directives, circulars from the Head of Service, and paperless registry transition guides.",
        "physical_location": "Permanent Secretary Archive Vault, Jacket #02",
        "color_tag": "purple",
        "files": [
            {
                "id": "file-003-1",
                "name": "HOS_Circular_Paperless_ECM_Compliance.pdf",
                "size": 380000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/hos-circular-ecm.pdf",
                "cloudinary_public_id": "seed_placeholder_hos_circular",
                "notes": "Circular mandating all MDAs to migrate from physical paper memos to electronic registry by Dec 1.",
                "correspondence_id": "corr-004",
                "correspondence_ref": "EDSG/MOCDE/INW/2026/0016",
                "preview_content": (
                    "CIRCULAR TO ALL MINISTRIES, DEPARTMENTS AND AGENCIES\n"
                    "Ref No: HOS/ED/CIR/2026/VOL.VI/12\n"
                    "Date: 13th October, 2026\n\n"
                    "Effective 1st December 2026, all official inter-ministerial memoranda "
                    "must be lodged into the electronic registry. Physical dispatch will "
                    "only be permitted for confidential judicial and statutory legal "
                    "warrants."
                ),
            },
        ],
    },
]


# ─────────────────────────────────────────────────────────────────────
# Sample correspondence (5 letters matching the current frontend seed)
# ─────────────────────────────────────────────────────────────────────
SEED_CORRESPONDENCE = [
    {
        "id": "corr-001",
        "registry_no": "EDSG/MOCDE/INW/2026/0014",
        "type": "incoming",
        "record_date": "2026-10-12",
        "date_on_correspondence": "2026-10-10",
        "source": "Office of the Executive Governor, Denis Osadebay Avenue, Benin City",
        "target": None,
        "title": "Executive Directive: Fast-Tracking Statewide Rollout of Edo GovNet Fiber Broadband to all 18 Local Government Area Secretariats",
        "file_number": "EDSG/MOCDE/INFRA/2026/008",
        "folder_id": "folder-001",
        "category": "Broadband Infrastructure",
        "priority": "immediate",
        "status": "in_treatment",
        "action_officer": "Director, ICT Infrastructure & Broadband",
        "physical_location": "Central Registry Cabinet 1, Shelf A, Jacket #08",
        "folio_number": "Folio 42",
        "remarks": "Minuted by Hon. Commissioner to Director ICT Infrastructure to submit deployment milestone report and contractor SLA review by 20th Oct.",
        "dispatch_method": None,
        "letter_body": (
            "I am directed by His Excellency, the Executive Governor of Edo State, "
            "to convey approval for the accelerated Phase II rollout of the Edo State "
            "Government Enterprise Network (Edo GovNet).\n\n"
            "The Ministry of Communication and Digital Economy is hereby charged with "
            "the immediate interconnection of all eighteen (18) Local Government Area "
            "headquarters to the high-speed optical fiber backbone. This will guarantee "
            "secure voice, video conferencing, and automated revenue collection across "
            "all councils.\n\n"
            "The Honourable Commissioner is requested to submit a comprehensive "
            "deployment schedule, Right-of-Way (RoW) clearance report, and monthly "
            "delivery milestones within fourteen (14) working days from the date of "
            "this communication."
        ),
        "signatory": "Principal Secretary to the Executive Governor",
        "documents": [
            {
                "id": "doc-001-a",
                "name": "Executive_Directive_GovNet_18_LGA_Expansion.pdf",
                "size": 420000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/executive-directive-govnet.pdf",
                "cloudinary_public_id": "seed_placeholder_executive_directive",
                "preview_content": "See folder file file-001-1 for full text.",
            },
            {
                "id": "doc-001-b",
                "name": "LGA_Secretariat_Fiber_Route_Survey_Map.pdf",
                "size": 1480000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/fiber-route-survey.pdf",
                "cloudinary_public_id": "seed_placeholder_fiber_route",
                "preview_content": "See folder file file-001-2 for full text.",
            },
        ],
    },
    {
        "id": "corr-002",
        "registry_no": "EDSG/MOCDE/OUT/2026/0009",
        "type": "outgoing",
        "record_date": "2026-10-14",
        "date_on_correspondence": "2026-10-14",
        "source": None,
        "target": "National Information Technology Development Agency (NITDA), Abuja",
        "title": "Formal Request for Strategic Partnership on Digital Literacy, AI Skill Hubs, and Tech Equipment for Edo Innovates Centres (Benin, Ekpoma, Auchi)",
        "file_number": "EDSG/MOCDE/DIG/2026/015",
        "folder_id": "folder-002",
        "category": "Digital Economy & Innovation",
        "priority": "urgent",
        "status": "dispatched",
        "action_officer": "Director, Digital Economy & Innovation",
        "physical_location": "Digital Economy Filing Cabinet 2, Jacket #15",
        "folio_number": "Folio 28",
        "remarks": "Transmitted with Edo Innovates 2026 Impact Matrix and proposal letter signed by Permanent Secretary.",
        "dispatch_method": "Official Dispatch Rider & Abuja Liaison Office Delivery",
        "letter_body": (
            "I have the honour to present the compliments of the Ministry of "
            "Communication and Digital Economy, Edo State Government.\n\n"
            "Under our flagship human capital program, \"Edo Innovates\", our "
            "administration has trained over 42,000 Edo youths in high-demand "
            "technical capabilities including Cloud Engineering, Full-Stack Web "
            "Development, Cybersecurity, and Artificial Intelligence.\n\n"
            "To decentralize these opportunities beyond the state capital, the "
            "Ministry is currently developing regional digital innovation clusters "
            "at Ekpoma (Edo Central) and Auchi (Edo North). We hereby solicit "
            "NITDA's collaboration under the National Digital Literacy Framework."
        ),
        "signatory": "Permanent Secretary, Ministry of Communication & Digital Economy",
        "documents": [
            {
                "id": "doc-002-a",
                "name": "NITDA_Partnership_Letter_MOCDE_Signed.pdf",
                "size": 310000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/nitda-partnership.pdf",
                "cloudinary_public_id": "seed_placeholder_nitda",
                "preview_content": "See folder file file-002-1 for full text.",
            },
            {
                "id": "doc-002-b",
                "name": "Edo_Innovates_Expansion_Framework_Benin_Ekpoma_Auchi.pdf",
                "size": 960000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/edo-innovates-framework.pdf",
                "cloudinary_public_id": "seed_placeholder_edo_innovates",
                "preview_content": "See folder file file-002-2 for full text.",
            },
        ],
    },
    {
        "id": "corr-003",
        "registry_no": "EDSG/MOCDE/INW/2026/0015",
        "type": "incoming",
        "record_date": "2026-10-14",
        "date_on_correspondence": "2026-10-11",
        "source": "Edo State Internal Revenue Service (EIRS), Benin City",
        "target": None,
        "title": "Technical Integration Request: Ministry Automated Revenue Collection Gateways and Right-of-Way (RoW) Telecoms Fee Verification Portal",
        "file_number": "EDSG/MOCDE/REV/2026/003",
        "folder_id": None,
        "category": "e-Governance & Software Solutions",
        "priority": "normal",
        "status": "minuted",
        "action_officer": "Head of Software & e-Governance Solutions",
        "physical_location": "Administration Registry, Shelf 2, Jacket #03",
        "folio_number": "Folio 14",
        "remarks": "Minuted for joint technical evaluation with EIRS software engineers on Wednesday.",
        "dispatch_method": None,
        "letter_body": (
            "The Executive Chairman of the Edo State Internal Revenue Service (EIRS) "
            "presents his compliments to the Honourable Commissioner, Ministry of "
            "Communication and Digital Economy.\n\n"
            "In furtherance of our revenue harmonization agenda, we propose an API "
            "integration between the EIRS Central Tax Administration System (ERAS) "
            "and the Ministry's Telecoms Infrastructure Permitting Portal.\n\n"
            "This seamless data exchange will enable automatic calculation and "
            "payment verification for telecommunication tower levies, mast inspection "
            "dues, and fiber optic linear trenching permits."
        ),
        "signatory": "Executive Chairman, Edo State Internal Revenue Service",
        "documents": [],
    },
    {
        "id": "corr-004",
        "registry_no": "EDSG/MOCDE/INW/2026/0016",
        "type": "incoming",
        "record_date": "2026-10-15",
        "date_on_correspondence": "2026-10-13",
        "source": "Office of the Head of Service, Edo State Public Service, Benin City",
        "target": None,
        "title": "Service-Wide Circular: Mandatory Compliance and Training on Edo State Enterprise Content Management (ECM) Paperless Office Protocols",
        "file_number": "EDSG/MOCDE/ADM/CIR/2026/002",
        "folder_id": "folder-003",
        "category": "Public Service Administration",
        "priority": "urgent",
        "status": "received",
        "action_officer": "Permanent Secretary, MOCDE",
        "physical_location": "Permanent Secretary Archive Vault, Jacket #02",
        "folio_number": "Folio 65",
        "remarks": "Awaiting minuting on scheduling specialized training for all Ministry desk officers.",
        "dispatch_method": None,
        "letter_body": (
            "CIRCULAR TO ALL MINISTRIES, DEPARTMENTS AND AGENCIES\n\n"
            "Ref No: HOS/ED/CIR/2026/VOL.VI/12\n"
            "Date: 13th October, 2026\n\n"
            "SUBJECT: TRANSITION TO FULL PAPERLESS OPERATIONS ACROSS EDO STATE CIVIL SERVICE\n\n"
            "1.0 Following the successful pilot of the electronic records system in "
            "the Ministry of Communication and Digital Economy, notice is hereby "
            "given that effective 1st December 2026, all inter-ministerial memoranda, "
            "approvals, and personnel files must be processed exclusively via the "
            "official electronic platform.\n\n"
            "2.0 The Ministry of Communication and Digital Economy is appointed the "
            "Lead Technical Coordinating Agency to conduct registry staff audits and "
            "schedule hands-on training sessions for all departmental registry "
            "supervisors."
        ),
        "signatory": "Head of Service, Edo State",
        "documents": [
            {
                "id": "doc-004-a",
                "name": "HOS_Circular_Paperless_ECM_Compliance.pdf",
                "size": 380000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/hos-circular-ecm.pdf",
                "cloudinary_public_id": "seed_placeholder_hos_circular",
                "preview_content": "See folder file file-003-1 for full text.",
            }
        ],
    },
    {
        "id": "corr-005",
        "registry_no": "EDSG/MOCDE/OUT/2026/0010",
        "type": "outgoing",
        "record_date": "2026-10-15",
        "date_on_correspondence": "2026-10-15",
        "source": None,
        "target": "Edo State Geographic Information Service (EDOGIS), Benin City",
        "title": "Transmission of High-Resolution Geospatial Mapping of Metro Fiber Optic Ducts along Ring Road - Airport Road Corridor",
        "file_number": "EDSG/MOCDE/INFRA/2026/008",
        "folder_id": "folder-001",
        "category": "Broadband Infrastructure",
        "priority": "normal",
        "status": "dispatched",
        "action_officer": "Director, ICT Infrastructure & Broadband",
        "physical_location": "Central Registry Cabinet 1, Shelf A, Jacket #08",
        "folio_number": "Folio 43",
        "remarks": "Delivered to EDOGIS Managing Director to safeguard telecom assets during urban drainage rehabilitation works.",
        "dispatch_method": "Official Hand Delivery via Registry Dispatch Officer",
        "letter_body": (
            "Please refer to previous inter-agency engagements on telecom asset "
            "protection during ongoing urban renewal and road construction works.\n\n"
            "We herewith transmit the high-precision differential GPS survey data "
            "and GIS layers detailing the underground fiber ducts, handholes, and "
            "manholes installed along:\n"
            "1. Ring Road (Kings Square) through Oba Market Road;\n"
            "2. Airport Road from Ring Road intersection to Benin Airport terminal;\n"
            "3. Sapele Road Secretariat corridor.\n\n"
            "These coordinates are provided to ensure that road excavation "
            "contractors incorporate our conduit network into their construction "
            "drawings to avoid costly network disruptions."
        ),
        "signatory": "Director, ICT Infrastructure & Broadband, for Hon. Commissioner",
        "documents": [
            {
                "id": "doc-005-a",
                "name": "EDOGIS_Transmittal_Letter_Ring_Road_Fiber.pdf",
                "size": 290000,
                "mime_type": "application/pdf",
                "cloudinary_url": "seed://placeholder/edogis-transmittal.pdf",
                "cloudinary_public_id": "seed_placeholder_edogis",
                "preview_content": "See folder file file-001-3 for full text.",
            }
        ],
    },
]


# ─────────────────────────────────────────────────────────────────────
# Sample audit log entries (for the Audit Trail view)
# ─────────────────────────────────────────────────────────────────────
SEED_AUDIT_LOGS = [
    {
        "action": "CREATE_CORRESPONDENCE",
        "actor_name": "Osamwonyi E.",
        "actor_role": "Central Registry Supervisor",
        "entity_type": "correspondence",
        "entity_id": "corr-001",
        "entity_ref": "EDSG/MOCDE/INW/2026/0014",
        "title": "Executive Directive on GovNet Rollout",
        "details": "Received and filed inward letter from Office of the Executive Governor into folder EDSG/MOCDE/INFRA/2026/008 with 2 attachments.",
        "ip_address": "10.24.1.14",
    },
    {
        "action": "UPDATE_CORRESPONDENCE",
        "actor_name": "Imasuen V.",
        "actor_role": "Senior Clerical Officer",
        "entity_type": "correspondence",
        "entity_id": "corr-003",
        "entity_ref": "EDSG/MOCDE/INW/2026/0015",
        "title": "EIRS Revenue Gateway Integration Request",
        "details": "Updated treatment status to \"minuted\" following directive from the Permanent Secretary.",
        "ip_address": "10.24.1.16",
    },
    {
        "action": "CREATE_CORRESPONDENCE",
        "actor_name": "Engr. Osas",
        "actor_role": "Directorate of ICT & e-Governance",
        "entity_type": "correspondence",
        "entity_id": "corr-002",
        "entity_ref": "EDSG/MOCDE/OUT/2026/0009",
        "title": "NITDA Partnership on Digital Skills",
        "details": "Dispatched outward letter via Official Dispatch Rider to NITDA Headquarters, Abuja.",
        "ip_address": "10.24.2.08",
    },
    {
        "action": "CREATE_FOLDER",
        "actor_name": "Osamwonyi E.",
        "actor_role": "Central Registry Supervisor",
        "entity_type": "folder",
        "entity_id": "folder-003",
        "entity_ref": "EDSG/MOCDE/ADM/CIR/2026/002",
        "title": "Edo State Enterprise Content Management (ECM) Rollout",
        "details": "Created new ministerial archive folder under Administration & Public Service e-Gov.",
        "ip_address": "10.24.1.14",
    },
    {
        "action": "GENERATE_QR",
        "actor_name": "Imasuen V.",
        "actor_role": "Senior Clerical Officer",
        "entity_type": "correspondence",
        "entity_id": "corr-005",
        "entity_ref": "EDSG/MOCDE/OUT/2026/0010",
        "title": "Geospatial Fiber Mapping Transmittal to EDOGIS",
        "details": "Generated digital verification QR code and printed official Docket Routing Slip for courier dispatch.",
        "ip_address": "10.24.1.16",
    },
]