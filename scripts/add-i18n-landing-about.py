# One-off: add the missing landing + about translation keys (EN + ES) to the
# next-intl message files. Idempotent deep-merge; preserves existing keys.
# Run:  python scripts/add-i18n-landing-about.py
import json, collections

EN = {
  "landing": {
    "howItWorks": {
      "heading": "How It Works",
      "intro": "Getting started with <b>The Raising Club</b> is simple. In three steps, families, caregivers, and programs connect inside one club for trusted care, real careers, and better-staffed programs.",
      "kicker1": "Join", "title1": "the Club",
      "kicker2": "Find",
      "kicker3": "Grow", "title3": "Together",
    },
    "audiences": {
      "sectionHeading": "Built for everyone raising children",
      "sectionSubtitle": "One club where the adults around each child connect, collaborate, and grow together.",
      "parentCta": "Get Started As A Family",
      "caregiverCta": "Become A TRC Caregiver",
      "organizationCta": "Hire & Train Educators",
      "parentPoints": [
        {"heading": "Care You Can Feel Confident In", "body": "See caregivers vetted for safety and experience, then use smart filters to find someone who fits your child and your family—not just your schedule."},
        {"heading": "Learn & Grow Together with TRC", "body": "Learn about child development with TRC, and invite the nanny you already love into TRC training so you share the same approach."},
        {"heading": "The Kind of Help Your Family Actually Needs", "body": "Choose caregivers whose strengths match your priorities—whether that’s early learning support, tutoring, home organization, or family meals."},
        {"heading": "Build Your Small Village", "body": "Connect with nearby families for nanny shares, shared care, and micro-programs, so your child has a stable circle of care and friendship."},
      ],
      "caregiverPoints": [
        {"heading": "Stand Out as a Professional", "body": "Create a profile that highlights your experience, training, and specialties so families and programs know you’re the right hire."},
        {"heading": "Grow with TRC Training & Badges", "body": "Earn TRC badges in child development and specialized family support to unlock premium, higher-paying roles."},
        {"heading": "Fair Pay, Clear Expectations", "body": "Find roles where pay, hours, and responsibilities are transparent from the start."},
        {"heading": "Families, Programs & Community That Fit You", "body": "Connect with families, daycares, centers, and fellow TRC caregivers—for roles, playdates, and a professional community that respects your work and shares your values."},
      ],
      "organizationPoints": [
        {"heading": "Trained & Credentialed Educators from Day One", "body": "Hire early childhood and out-of-school educators and caregivers with verified degrees, certifications, or TRC training."},
        {"heading": "Build a Reliable Staffing Bench with TRC Filters", "body": "Use TRC filters to keep a ready pool of floaters, substitutes, and out-of-school staff matched to your age groups and hours, so you don’t have to cancel classes or close rooms at the last minute."},
        {"heading": "Upskill the Team You Already Have", "body": "Enroll your classroom, after-school, and enrichment staff in TRC training and badges to raise quality in every setting."},
        {"heading": "A Program Parents Brag About", "body": "Show families a stable, trained team grounded in child development and out-of-school learning that sets you apart."},
      ],
    },
    "mission": {
      "quote": "When families rise, society rises.",
      "weAreLabel": "At The Raising Club, we are:",
      "raisingPrefix": "Raising ",
      "pillars": [
        {"accent": "Children", "body": "Children need more than supervision; they need emotionally steady, well-prepared adults who build deep self-trust and competence—so they can grow into their fullest selves."},
        {"accent": "Families", "body": "Families deserve an upgrade to their whole ecosystem—where quality care and real understanding of children are the norm, not the exception—so raising children feels shared, not lonely."},
        {"accent": "Caregivers", "body": "Nannies, professional caregivers, and educators deserve respect, training, and real careers—so they can build stable, dignified lives."},
        {"accent": "Society", "body": "Care for children must be treated as essential infrastructure—so work and opportunity aren’t limited by who can afford care, and the next generation grows up ready to lead."},
      ],
    },
    "joinCards": {
      "parentSub": "Find care and learn with TRC.",
      "caregiverSub": "Build your career and training.",
      "organizationSub": "Hire and upskill your team.",
    },
    "cta": {
      "storeGetItOn": "GET IT ON",
      "storeDownloadOn": "Download on the",
    },
  },
  "about": {
    "hero": {
      "eyebrow": "About Us",
      "titleLead": "We’re building the ",
      "titleHighlight": "modern village",
      "titleTail": " for families.",
      "description": "The Raising Club brings families, caregivers, and programs together with evidence-based guidance—so raising children feels less overwhelming and grounded in what helps them thrive.",
      "cta": "Join the Club",
    },
    "founder": {
      "eyebrow": "Meet Our Founder",
      "name": "Ara V.",
      "role": "Founder & Montessori Educator",
      "p1": "Araceli “Ara” Vazquez is an entrepreneur and educator transforming how childcare and early education are understood, delivered, and valued. Raised in Mexico in a family shaped by resilience and entrepreneurship—one that saw education as a path to opportunity—she brings both personal conviction and strategic vision to her work.",
      "p2": "As the founder of The Raising Club, she is building modern infrastructure for childhood, connecting families, caregivers, and organizations around a higher standard of care. With a background in Business Administration, a certification in Montessori education, and more than eight years of experience building a successful bilingual education program for children in New York City, Ara brings together an entrepreneurial mind and deep expertise in child development.",
      "p3": "Through her work, she is raising both the standard and the economics of childcare—helping caregivers earn more, families access better options, and organizations operate with stronger, more efficient models. She is helping redefine childcare as a high-value sector with the power to drive meaningful economic and social progress at scale.",
      "joinCta": "Join the Club",
      "manifestoCta": "Read our Manifesto",
    },
    "values": {
      "headingLead": "Built on values that put ",
      "headingAccent": "children first",
      "items": [
        {"lead": "Evidence", "accent": "Based", "body": "Every recommendation is grounded in child development science."},
        {"lead": "Community", "accent": "first", "body": "A real village: parents, caregivers, grandparents, and educators."},
        {"lead": "Built for", "accent": "Access", "body": "Designed for minorities, women, and disabled communities."},
      ],
    },
    "cta": {
      "headingLead": "Care shouldn’t be improvised—",
      "headingAccent": "and nobody should do it alone.",
      "description": "Join a growing community of intentional families, trained caregivers, and programs building something better—together.",
      "joinCta": "Join the Club",
      "manifestoCta": "Read our Manifesto",
    },
    "quoteLead": "When families rise, ",
    "quoteAccent": "society rises.",
  },
}

ES = {
  "landing": {
    "howItWorks": {
      "heading": "Cómo funciona",
      "intro": "Empezar con <b>The Raising Club</b> es muy sencillo. En tres pasos, las familias, los cuidadores y los programas se conectan dentro de un mismo club para lograr cuidado de confianza, carreras reales y programas mejor dotados de personal.",
      "kicker1": "Únete", "title1": "al Club",
      "kicker2": "Encuentra",
      "kicker3": "Crece", "title3": "Juntos",
    },
    "audiences": {
      "sectionHeading": "Diseñado para todos los que crían niños",
      "sectionSubtitle": "Un solo club donde los adultos que rodean a cada niño se conectan, colaboran y crecen juntos.",
      "parentCta": "Empieza como familia",
      "caregiverCta": "Conviértete en cuidador de TRC",
      "organizationCta": "Contrata y forma educadores",
      "parentPoints": [
        {"heading": "Cuidado en el que puedes confiar", "body": "Conoce cuidadores verificados en seguridad y experiencia, y usa filtros inteligentes para encontrar a alguien que encaje con tu hijo y tu familia, no solo con tu horario."},
        {"heading": "Aprende y crece junto a TRC", "body": "Aprende sobre el desarrollo infantil con TRC e invita a la niñera que ya adoras a la formación de TRC para que compartan el mismo enfoque."},
        {"heading": "La ayuda que tu familia realmente necesita", "body": "Elige cuidadores cuyas fortalezas coincidan con tus prioridades: apoyo al aprendizaje temprano, tutorías, organización del hogar o comidas en familia."},
        {"heading": "Construye tu pequeña aldea", "body": "Conéctate con familias cercanas para compartir niñera, cuidado compartido y microprogramas, para que tu hijo tenga un círculo estable de cuidado y amistad."},
      ],
      "caregiverPoints": [
        {"heading": "Destaca como profesional", "body": "Crea un perfil que resalte tu experiencia, formación y especialidades para que las familias y los programas sepan que eres la persona ideal."},
        {"heading": "Crece con la formación y las insignias de TRC", "body": "Obtén insignias de TRC en desarrollo infantil y apoyo familiar especializado para acceder a puestos premium y mejor pagados."},
        {"heading": "Pago justo, expectativas claras", "body": "Encuentra puestos donde el pago, las horas y las responsabilidades son transparentes desde el principio."},
        {"heading": "Familias, programas y comunidad que encajan contigo", "body": "Conéctate con familias, guarderías, centros y otros cuidadores de TRC, para encontrar empleos, citas de juego y una comunidad profesional que respeta tu trabajo y comparte tus valores."},
      ],
      "organizationPoints": [
        {"heading": "Educadores formados y acreditados desde el primer día", "body": "Contrata educadores y cuidadores de primera infancia y de actividades extraescolares con títulos, certificaciones o formación de TRC verificados."},
        {"heading": "Crea un equipo de reemplazo confiable con los filtros de TRC", "body": "Usa los filtros de TRC para mantener un grupo disponible de personal flotante, sustitutos y personal extraescolar adaptado a tus grupos de edad y horarios, para que no tengas que cancelar clases ni cerrar aulas a último momento."},
        {"heading": "Capacita al equipo que ya tienes", "body": "Inscribe a tu personal de aula, extraescolar y de enriquecimiento en la formación e insignias de TRC para elevar la calidad en cada entorno."},
        {"heading": "Un programa del que los padres presumen", "body": "Muestra a las familias un equipo estable y capacitado, basado en el desarrollo infantil y el aprendizaje extraescolar, que te distingue."},
      ],
    },
    "mission": {
      "quote": "Cuando las familias se elevan, la sociedad se eleva.",
      "weAreLabel": "En The Raising Club, somos:",
      "raisingPrefix": "Criando ",
      "pillars": [
        {"accent": "Niños", "body": "Los niños necesitan más que supervisión; necesitan adultos emocionalmente estables y bien preparados que construyan una profunda confianza en sí mismos y competencia, para que puedan crecer y alcanzar su máximo potencial."},
        {"accent": "Familias", "body": "Las familias merecen una mejora en todo su ecosistema, donde el cuidado de calidad y la comprensión real de los niños sean la norma y no la excepción, para que criar hijos se sienta compartido y no solitario."},
        {"accent": "Cuidadores", "body": "Las niñeras, los cuidadores profesionales y los educadores merecen respeto, formación y carreras reales, para que puedan construir vidas estables y dignas."},
        {"accent": "la Sociedad", "body": "El cuidado de los niños debe tratarse como infraestructura esencial, para que el trabajo y las oportunidades no estén limitados por quién puede pagar el cuidado, y la próxima generación crezca lista para liderar."},
      ],
    },
    "joinCards": {
      "parentSub": "Encuentra cuidado y aprende con TRC.",
      "caregiverSub": "Desarrolla tu carrera y tu formación.",
      "organizationSub": "Contrata y capacita a tu equipo.",
    },
    "cta": {
      "storeGetItOn": "DISPONIBLE EN",
      "storeDownloadOn": "Descárgala en",
    },
  },
  "about": {
    "hero": {
      "eyebrow": "Quiénes somos",
      "titleLead": "Estamos construyendo la ",
      "titleHighlight": "aldea moderna",
      "titleTail": " para las familias.",
      "description": "The Raising Club reúne a familias, cuidadores y programas con orientación basada en evidencia, para que criar hijos se sienta menos abrumador y esté fundamentado en lo que les ayuda a prosperar.",
      "cta": "Únete al Club",
    },
    "founder": {
      "eyebrow": "Conoce a nuestra fundadora",
      "name": "Ara V.",
      "role": "Fundadora y educadora Montessori",
      "p1": "Araceli «Ara» Vázquez es una emprendedora y educadora que está transformando la forma en que se entiende, se brinda y se valora el cuidado infantil y la educación temprana. Criada en México en una familia marcada por la resiliencia y el espíritu emprendedor —una que veía la educación como un camino hacia las oportunidades—, aporta convicción personal y visión estratégica a su trabajo.",
      "p2": "Como fundadora de The Raising Club, está construyendo una infraestructura moderna para la infancia, conectando a familias, cuidadores y organizaciones en torno a un estándar de cuidado más alto. Con formación en Administración de Empresas, una certificación en educación Montessori y más de ocho años de experiencia creando un exitoso programa de educación bilingüe para niños en la ciudad de Nueva York, Ara combina una mente emprendedora con un profundo conocimiento del desarrollo infantil.",
      "p3": "A través de su trabajo, está elevando tanto el estándar como la economía del cuidado infantil, ayudando a los cuidadores a ganar más, a las familias a acceder a mejores opciones y a las organizaciones a operar con modelos más sólidos y eficientes. Está ayudando a redefinir el cuidado infantil como un sector de alto valor con el poder de impulsar un progreso económico y social significativo a gran escala.",
      "joinCta": "Únete al Club",
      "manifestoCta": "Lee nuestro manifiesto",
    },
    "values": {
      "headingLead": "Construido sobre valores que ponen a los ",
      "headingAccent": "niños primero",
      "items": [
        {"lead": "Basado en", "accent": "Evidencia", "body": "Cada recomendación se basa en la ciencia del desarrollo infantil."},
        {"lead": "La comunidad", "accent": "primero", "body": "Una verdadera aldea: padres, cuidadores, abuelos y educadores."},
        {"lead": "Diseñado para el", "accent": "Acceso", "body": "Diseñado para minorías, mujeres y comunidades con discapacidad."},
      ],
    },
    "cta": {
      "headingLead": "El cuidado no debería improvisarse—",
      "headingAccent": "y nadie debería hacerlo solo.",
      "description": "Únete a una comunidad creciente de familias intencionales, cuidadores capacitados y programas que construyen algo mejor, juntos.",
      "joinCta": "Únete al Club",
      "manifestoCta": "Lee nuestro manifiesto",
    },
    "quoteLead": "Cuando las familias se elevan, ",
    "quoteAccent": "la sociedad se eleva.",
  },
}

def deep_merge(dst, src):
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            deep_merge(dst[k], v)
        else:
            dst[k] = v  # overwrite scalars/arrays with our canonical copy

for path, extra in (("messages/en.json", EN), ("messages/es.json", ES)):
    data = json.load(open(path, encoding="utf-8"), object_pairs_hook=collections.OrderedDict)
    deep_merge(data, extra)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("updated", path)
