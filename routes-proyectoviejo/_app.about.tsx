// Líneas 1-20 - Imports con dependencias de autenticación
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, Link } from "@remix-run/react"
import { getClerkUser } from "~/lib/auth-clerk.server"
import { SignInButton, SignUpButton } from "@clerk/remix"  // ✅ AGREGADO
import {
  Heart,
  Lightbulb,
  Shield,
  Users,
  Target,
  TrendingUp,
  Star,
  Zap,
  Globe,
  Award,
  Coffee,
  Leaf,
  ArrowRight,
  User,      // ✅ AGREGADO - Ícono para avatar del modal
  X          // ✅ AGREGADO - Ícono para botón de cierre
} from 'lucide-react'
import { useEffect, useState } from "react"  // ✅ MODIFICADO - Agregado useState

export async function loader(args: LoaderFunctionArgs) {
  const user = await getClerkUser(args)
  
  return json({ user })
}

// Custom hook for elegant smooth scroll animation with matcha latte style
function useSmoothScroll() {
  useEffect(() => {
    // Handle smooth scrolling with elegant easing
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = target.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        
        // Add active class to clicked nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        target.classList.add('active');
        
        if (targetElement) {
          // Get the parent of the target for more context-aware scroll position
          const scrollPosition = targetElement.offsetTop - 80;
          
          // Create a pulse effect on the target section
          targetElement.classList.add('pulse-highlight');
          setTimeout(() => targetElement.classList.remove('pulse-highlight'), 1000);
          
          // Smoothly scroll to the section
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    };
    
    document.addEventListener('click', handleAnchorClick);
    
    // Update active nav based on scroll position
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const sections = document.querySelectorAll('section[id]');
      const navItems = document.querySelectorAll('.nav-item');
      
      sections.forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop - 150;
        const sectionBottom = sectionTop + (section as HTMLElement).offsetHeight;
        const sectionId = section.getAttribute('id') || '';
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${sectionId}`) {
              item.classList.add('active');
            }
          });
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

export default function About() {
  const { user } = useLoaderData<typeof loader>()
  useSmoothScroll();
// ✅ GESTIÓN DE ESTADO PARA MODAL DE AUTENTICACIÓN
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)

  // ✅ HANDLER PARA ACTIVACIÓN DEL MODAL
  const handleBeginNow = () => {
    setPendingRedirect("/listings")
    setShowAuthModal(true)
  }
  // Enhanced animations for elegant matcha latte style
  useEffect(() => {
    // Fade-in animation with staggered delay for children
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add fade-in to parent
          entry.target.classList.add('animate-fade-in');
          
          // Add staggered animations to children
          const animatedChildren = entry.target.querySelectorAll('.animate-child');
          animatedChildren.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('animate-fade-in');
            }, 100 * (index + 1));
          });
        }
      });
    }, { 
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px' // Trigger a bit earlier
    });

    const sections = document.querySelectorAll('.scroll-fade');
    sections.forEach(section => {
      observer.observe(section);
    });

    // Add parallax effect to decorative elements
    const handleParallax = () => {
      const scrollY = window.scrollY;
      const parallaxElements = document.querySelectorAll('.parallax');
      
      parallaxElements.forEach((element) => {
        const speed = element.getAttribute('data-speed') || '0.1';
        const yPos = scrollY * parseFloat(speed);
        element.setAttribute('style', `transform: translateY(${yPos}px)`);
      });
    };
    
    window.addEventListener('scroll', handleParallax);

    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
      window.removeEventListener('scroll', handleParallax);
    };
  }, []);

  const valores = [
    {
      title: "Confianza",
      description: "Operamos con integridad, transparencia y compromiso en cada trato y cada entrega.",
      icon: Shield,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Innovación", 
      description: "Creamos soluciones únicas en tecnología, marketing y comercio para mantenernos siempre un paso adelante.",
      icon: Lightbulb,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Versatilidad",
      description: "Nos adaptamos al cambio, combinando creatividad, análisis y acción en diferentes áreas de negocio.",
      icon: Zap,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Pasión por el cliente",
      description: "Escuchamos, entendemos y resolvemos, poniendo al cliente en el centro de todo.",
      icon: Heart,
      color: "from-red-500 to-red-600"
    },
    {
      title: "Excelencia",
      description: "Nos enfocamos en hacer las cosas bien, desde una cotización de auto hasta una línea de código.",
      icon: Award,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Crecimiento compartido",
      description: "Generamos alianzas y oportunidades para todos los que forman parte de nuestra comunidad.",
      icon: TrendingUp,
      color: "from-indigo-500 to-indigo-600"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Elegant Floating Navigation with Matcha Latte Style */}
      <nav className="hidden md:block fixed right-10 top-1/2 transform -translate-y-1/2 z-50">
        <div className="bg-white/70 backdrop-blur-md rounded-full py-6 px-3 shadow-xl border border-green-100 transition-all duration-500 hover:bg-white/90 hover:border-green-200">
          <ul className="flex flex-col items-center space-y-8">
            <li>
              <a href="#vision" className="nav-item p-3 text-green-700 hover:text-green-500 transition-all duration-300 relative group" title="Visión">
                <Target className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg text-sm text-green-800 whitespace-nowrap">
                  Visión
                </span>
                <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            </li>
            <li>
              <a href="#mision" className="nav-item p-3 text-green-700 hover:text-green-500 transition-all duration-300 relative group" title="Misión">
                <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg text-sm text-green-800 whitespace-nowrap">
                  Misión
                </span>
                <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            </li>
            <li>
              <a href="#valores" className="nav-item p-3 text-green-700 hover:text-green-500 transition-all duration-300 relative group" title="Valores">
                <Heart className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg text-sm text-green-800 whitespace-nowrap">
                  Valores
                </span>
                <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            </li>
            <li>
              <a href="#contacto" className="nav-item p-3 text-green-700 hover:text-green-500 transition-all duration-300 relative group" title="Contacto">
                <Coffee className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg text-sm text-green-800 whitespace-nowrap">
                  Contacto
                </span>
                <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-50 via-white to-transparent z-0"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-8 -right-4 w-72 h-72 bg-teal-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="text-center space-y-10">
            <div className="space-y-5">
              <div className="inline-block animate-fade-in">
                <span className="text-sm font-medium text-green-600 tracking-widest uppercase px-4 py-1.5 bg-green-50 rounded-full">
                  Conoce Nuestra Historia
                </span>
              </div>
              <h1 className="text-6xl sm:text-8xl font-extralight text-gray-900 tracking-tight leading-none animate-fade-in animation-delay-300">
                CLIQUEALO
                <div className="flex items-center justify-center">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent via-green-300 to-transparent mx-3"></div>
                  <span className="block text-xl sm:text-2xl font-normal text-green-700 mt-2 tracking-widest">
                    DE MÉXICO
                  </span>
                  <div className="h-px w-8 bg-gradient-to-r from-transparent via-green-300 to-transparent mx-3"></div>
                </div>
              </h1>
              <p className="text-xl sm:text-2xl font-light text-gray-600 max-w-3xl mx-auto leading-relaxed italic animate-fade-in animation-delay-500">
                "Creando no solo una marca, sino un estilo de vida."
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-8 pt-8 animate-fade-in animation-delay-700">
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
              <Leaf className="w-8 h-8 text-green-500" />
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
            </div>
            
            <div className="animate-bounce animation-delay-1000 mt-10">
              <a href="#vision" className="inline-block">
                <div className="w-10 h-10 mx-auto border border-green-200 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-32 bg-white scroll-fade opacity-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-green-50 rounded-full">
                  <Target className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-600 tracking-widest uppercase">
                    Nuestra Visión
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-light text-gray-900 leading-tight">
                  Transformando
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">experiencias</span>
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Ser una marca mexicana referente en innovación y confianza, que transforma la experiencia de compra-venta de autos, el desarrollo tecnológico y la creación de contenido, conectando a las personas con soluciones digitales, seguras y creativas.
              </p>
              
              <div className="pt-6">
                <a href="#mision" className="inline-flex items-center px-6 py-3 border border-green-100 text-green-700 bg-green-50 hover:bg-green-100 transition-colors rounded-full text-sm font-medium">
                  <span>Conoce nuestra misión</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute top-0 right-0 -mt-10 -mr-10">
                <div className="w-20 h-20 bg-amber-50 rounded-full opacity-70"></div>
              </div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10">
                <div className="w-24 h-24 bg-teal-50 rounded-full opacity-70"></div>
              </div>
              
              <div className="aspect-square bg-gradient-to-br from-green-50 to-teal-50 rounded-3xl p-8 flex items-center justify-center shadow-lg relative z-10">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mx-auto flex items-center justify-center transform hover:rotate-12 transition-transform duration-500">
                    <Star className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-medium text-gray-900">Innovación</h3>
                    <p className="text-gray-600">Líder en transformación digital</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mision" className="py-32 bg-gradient-to-br from-green-50 to-white scroll-fade opacity-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-amber-50 rounded-full">
                  <Users className="w-5 h-5 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-600 tracking-widest uppercase">
                    Nuestra Misión
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-light text-gray-900 leading-tight">
                  Impulsando
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">crecimiento</span>
                </h2>
              </div>
              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  Impulsar el crecimiento de nuestros clientes mediante servicios integrales en tres pilares fundamentales:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-amber-400 rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Venta de autos</span> con procesos transparentes, confiables y adaptados a las necesidades reales del mercado.
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-amber-400 rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Creación de contenidos</span> que informan, inspiran y generan valor.
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-amber-400 rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">Desarrollo de software</span> que automatiza, optimiza y transforma digitalmente negocios y experiencias.
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 font-medium italic border-l-4 border-amber-200 pl-4 py-2">
                  Todo esto con un enfoque humano, profesional y centrado en la calidad.
                </p>
              </div>
            </div>
            
            <div className="lg:order-1 relative">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="aspect-square bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">🚗</span>
                      </div>
                      <p className="text-sm font-medium text-amber-900">Autos</p>
                    </div>
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">📱</span>
                      </div>
                      <p className="text-sm font-medium text-teal-900">Software</p>
                    </div>
                  </div>
                </div>
                <div className="pt-8">
                  <div className="aspect-square bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">✨</span>
                      </div>
                      <p className="text-sm font-medium text-rose-900">Contenido</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="valores" className="py-32 bg-white scroll-fade opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="inline-block text-sm font-medium text-gray-500 tracking-widest uppercase px-4 py-2 bg-gray-50 rounded-full">
              Nuestros Valores
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900">
              Lo que nos
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">
                define
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {valores.map((valor, index) => {
              const IconComponent = valor.icon
              return (
                <div
                  key={valor.title}
                  className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
                >
                  <div className="space-y-6">
                    <div className="relative">
                      <div className={`w-20 h-20 bg-gradient-to-br ${valor.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <IconComponent className="w-10 h-10 text-white" />
                      </div>
                      <div className={`absolute inset-0 w-20 h-20 bg-gradient-to-br ${valor.color} rounded-2xl opacity-20 scale-125 group-hover:scale-150 transition-transform duration-500`}></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {valor.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                        {valor.description}
                      </p>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <span className="text-lg font-light text-green-700">0{index + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

{/* ✅ CTA Section - CORREGIDA Y OPTIMIZADA */}
<section 
  id="contacto" 
  className="py-32 bg-gradient-to-br from-green-900 via-emerald-800 to-teal-800 relative opacity-100 transition-opacity duration-1000"
  style={{ pointerEvents: 'auto' }}
>
  {/* ✅ Overlay corregido - No interfiere con clicks */}
  <div 
    className="absolute inset-0 bg-[url('/img/texture.png')] opacity-10 mix-blend-overlay"
    style={{ pointerEvents: 'none', zIndex: 1 }}
  ></div>
  
  {/* ✅ Contenido con z-index superior */}
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
    <div className="space-y-8">
      <div className="space-y-4">
        <Coffee className="w-12 h-12 text-green-300 mx-auto" />
        <h2 className="text-4xl sm:text-5xl font-light text-white">
          ¿Listo para ser parte de
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-teal-200">
            la experiencia?
          </span>
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          Únete a nosotros y descubre cómo podemos transformar tu manera de ver los negocios digitales.
        </p>
      </div>
      
      {/* ✅ BOTÓN COMPLETAMENTE INTERACTIVO */}
      <div 
        className="flex flex-col sm:flex-row gap-6 justify-center items-center relative z-20"
        style={{ pointerEvents: 'auto' }}
      >
        <Link
          to="/listings"
          className="group inline-flex items-center space-x-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-medium shadow-xl transition-all duration-300 ease-out hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20 cursor-pointer"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 30,
            position: 'relative'
          }}
          aria-label="Explorar catálogo de autos disponibles"
        >
          <span className="transition-colors duration-200">Explorar Catálogo</span>
          <ArrowRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1" />
        </Link>
{/* ✅ BOTÓN COMENZAR AHORA - Integración Modal */}
<button
  onClick={handleBeginNow}
  className="group inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-xl font-medium shadow-xl transition-all duration-300 ease-out hover:from-green-600 hover:to-teal-600 hover:shadow-2xl hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400/20 cursor-pointer"
  style={{ 
    pointerEvents: 'auto',
    zIndex: 30,
    position: 'relative'
  }}
  aria-label="Comenzar proceso de registro"
>
  <span className="transition-colors duration-200">Comenzar Ahora</span>
  <ArrowRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1" />
</button>
      </div>
    </div>
  </div>
</section>

      {/* 🚀 SISTEMA MODAL DE AUTENTICACIÓN - Arquitectura Enterprise */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            
            {/* ✅ Modal Header - Control de Ciclo de Vida */}
            <button
              onClick={() => {
                setShowAuthModal(false);
                setPendingRedirect(null);
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ✅ Branding Section - Contextual Identity */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Únete a Cliquéalo.mx
              </h2>
              <p className="text-gray-600">
                Crea tu cuenta gratuita para ver más autos y acceder a todas las funciones
              </p>
            </div>

            {/* ✅ Authentication Flow - Clerk SDK Integration */}
            <div className="space-y-3 mb-6">
              <SignUpButton
                mode="modal"
  fallbackRedirectUrl={pendingRedirect || "/"}     // ✅ Prop correcta
  signInFallbackRedirectUrl={pendingRedirect || "/"}  // ✅ Prop adicional requerida
              >
                <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95">
                  Registrarse Gratis
                </button>
              </SignUpButton>

              <SignInButton
                mode="modal"
  fallbackRedirectUrl={pendingRedirect || "/"}     // ✅ Prop correcta
  signUpFallbackRedirectUrl={pendingRedirect || "/"}  // ✅ Prop adicional requerida
              >
                <button className="w-full bg-white text-green-700 py-3 px-6 rounded-xl border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 font-medium">
                  Ya tengo cuenta
                </button>
              </SignInButton>
            </div>

            {/* ✅ Value Proposition - Conversion Optimization */}
            <div className="text-sm text-gray-500 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Acceso completo al catálogo</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Guardar autos favoritos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Aplicar para créditos automotrices</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Enhanced CSS Animations - Modal Support Integration */}
      <style>{`
        /* 🔧 Interactivity Enforcement */
        a, button {
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        
        /* 🎬 Modal Animation Framework */
        .modal-overlay {
          backdrop-filter: blur(4px);
          animation: fadeIn 300ms ease-out;
        }
        
        .modal-content {
          animation: slideIn 300ms ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* 🎨 Elegant blob animation - Preserved */
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: floatElement 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        /* 🌟 Focus Management Enhancement */
        .focus-trap {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }
        
        /* 🎯 Z-Index Layer Management */
        .modal-layer {
          z-index: 9999;
        }
        
        /* ♿ Accessibility Compliance */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  )
}