import { json, type MetaFunction, type LinksFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useState, useEffect, type ReactNode } from "react";
import { CreditCard, Crown, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardBody,
  CardFooter,
  Input,
  Button,
  Divider
} from "@heroui/react";
import { toast } from "~/components/ui/toast";

// Import Google Font
export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&display=swap",
  },
];

export const meta: MetaFunction = () => {
  return [
    { title: "The Cliquéalo Lounge Club | Acceso Exclusivo" },
    { name: "description", content: "Acceso exclusivo para miembros del Cliquéalo Lounge Club. Solo por invitación." },
  ];
};

export async function action() {
  // En un entorno real, aquí verificaríamos el member number contra una base de datos
  // Por ahora, este es solo un borrador que siempre devuelve "invalid"
  return json({ status: "invalid" });
}

// Type definitions for component props
interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

// Collapsible Section Component for the main content
function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-zinc-800 pb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 text-left"
      >
        <h2 className="text-xl font-serif text-stone-200 tracking-wide">{title}</h2>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-amber-800" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-800" />
        )}
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100 pt-2 pb-4" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}

// Mobile Collapsible Section with different styling
function MobileCollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-zinc-800 rounded">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left bg-zinc-900"
      >
        <h3 className="text-base font-serif text-stone-200 tracking-wide">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-amber-800" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-800" />
        )}
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-4 border-t border-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LoungeClub() {
  const actionData = useActionData<typeof action>();
  const [memberNumber, setMemberNumber] = useState("");

  // Efecto visual cuando se envía un formulario - usando useEffect para prevenir múltiples toasts
  useEffect(() => {
    if (actionData?.status === "invalid") {
      toast.error("Número de miembro no reconocido", "Este número no está registrado en nuestra base de datos exclusiva.");
    }
  }, [actionData]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black opacity-80"></div>
      <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAABCRJREFUaEPtmcuKFEEQhv+qmZ1lEBEP4kFBQfAFfALxKOJJfALxEfQJRBAED4IexJOgB71tV7syI6MrujqrZ3pmYWdhoWe6qzLiy4j4I7OK7e7k/+zZDgiYGX4vvl08M5sAML8GcMA5t2Vmh8xsBcCHEMLnuq7PAvgM4LRz7qGZfQQwBfCy6Dq6N4SQbqG/EZHJWTHQPdtKCHvvP5jZNoBTZrYXQngnIjNgzrntEMLpqqouOOdumdmOmb0KIXysqupsCOFDCOGjiJz23u+Y2csQwl5d1+dE5EsIYStfo21gLQLRQDnnzpnZLTObhhBeiMhMUmbWCEpErjjnbgKYhhBeiEgOZGFNLAPI4t2hqqouALhhZtMQwvMcUDKS2bXW8rquL4rIdQBTM3seQvgUY5wDWQbM0oCICDV0xsxu1HV9ycyuAZiEEJ5pDHjvZdaambXW8qZpLovIVQATM3sWQtgVkXMA9rrCdIXYbBZ7A5FgBOSqmV0BUJvZfghhN8Z4QUR2QwiNtZbHGC+Z2RUA0xDCsxDCTogxr5G5OlkGyFIgIlIB2AKwBeBmjLGxvPd+28y2OgUyA+O930kW05hFxvyotRbee6WA9kFkIGPnx3LNSU8gHX+/BuAygLqu67sicp4xyXt/AcB1AFMReSYiu1VVXQwh7IQQngDYqapqK4SwzzzT1cgUwKM+YIY6vRIgZnYOwDUzm5jZMxHZNbNzZraT6xPAmRDCJITwNISwKyLnRGRHRJ4AeOK9V41o7XStzI4a5NoHzJiaaB+zShC/A/gIYGJmD0MIj2OMp0II70MID0Tkgff+lIh8CCE8FJEHMcbTIvJORB4DeOS9PwHgRwiB+eZnjPFUCOF9COFBjPF0COGdmT3sCnPsOHmUnQ3RiIhoBtJE9lpEKHideCdt+y20O2kbvUbRrS+z00ZvYo36e6UaSYfW7BSAPRG5G0LYF5GGQM1sL4RwV0QOAMxeRyJ+Jve4kzzTwPRxbCOAaNIys0MAd0II+wBmyc85dzjGqH3MvKDM7PB3QSr2R9lfpRrRxhDAHTPbZ41wjgPL/mUf4+lPAEgFz+c4/3COvzn2wPJQqzHvnDZiIwLwCYC6VFXXNRRCCB9CCHfyrtd7f9HM7oUQPqQdLHPTT83MInYt1UjFBJYK3Hl3a8ZarZnFGK+klrkbQthJ3a9uJxdqZC2BFAExeATgWdLINm2S+uSqCBw5O1vVpDY6RtYWSO7ovpndb5rmgZm1bnUlQMYG0LrXyFFg1h7IUUC6z60lkHXyeaOBrJM2mgxZ2lqbXmTmWV0p5Tc+RpalQC6AqdhUYWpsYnwqWKqLuT6LgXvq6d9pZMyzAaDd9JYALPpdQTfMaLd+1Iy5/ttSpf87u+4H9v0B2xtIbm1/ALwuFXIJVAcbAAAAAElFTkSuQmCC')] opacity-3"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        {/* Refined header */}
        <header className="text-center mb-24">
          <div className="mb-6 inline-flex items-center">
            <div className="h-px w-8 bg-amber-800 opacity-70"></div>
            <span className="mx-4 text-xs tracking-[0.4em] font-serif text-amber-800">MEMBRESÍA EXCLUSIVA</span>
            <div className="h-px w-8 bg-amber-800 opacity-70"></div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-serif font-light tracking-wider mb-8 text-stone-100">
            THE CLIQUÉALO <span 
              className="text-amber-700" 
              style={{ 
                fontFamily: '"Mrs Saint Delafield", cursive',
                fontSize: '1.2em',
                fontWeight: '400',
                letterSpacing: '0.02em',
                transform: 'translateY(4px)',
                display: 'inline-block'
              }}
            >Lounge</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-stone-400 text-sm font-light leading-relaxed font-serif tracking-wide">
            Una experiencia distinguida para verdaderos conocedores. Acceso por invitación exclusiva.
          </p>
        </header>

        {/* Refined two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          {/* Left column: Collapsible content */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <p className="text-amber-800 font-serif text-sm tracking-wider mb-2">DISTINCIÓN</p>
            </div>
            
            {/* Collapsible Sections */}
            <CollapsibleSection 
              title="Membresía Exclusiva"
              defaultOpen={true}
            >
              <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
                El Lounge Club ofrece una experiencia única para verdaderos conocedores. Acceso privilegiado a vehículos de edición limitada y eventos privados que reflejan nuestra tradición de excelencia.
              </p>
            </CollapsibleSection>
            
            <CollapsibleSection 
              title="Privilegios"
              defaultOpen={false}
            >
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-stone-300 font-serif">
                  <CheckCircle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                  <span className="tracking-wide">Acceso anticipado a vehículos de colección</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-300 font-serif">
                  <CheckCircle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                  <span className="tracking-wide">Eventos privados y presentaciones exclusivas</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-300 font-serif">
                  <CheckCircle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                  <span className="tracking-wide">Concierge personal dedicado a tiempo completo</span>
                </li>
              </ul>
            </CollapsibleSection>
            
            <CollapsibleSection 
              title="Experiencia Premium"
              defaultOpen={false}
            >
              <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
                Anticipación exclusiva a nuestras adquisiciones más distinguidas y eventos privados reservados para miembros selectos.
              </p>
            </CollapsibleSection>
            
            <CollapsibleSection 
              title="Financiamiento Privilegiado"
              defaultOpen={false}
            >
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
                  Opciones de financiamiento exclusivas y oportunidades de inversión para vehículos de colección seleccionados.
                </p>
              </div>
            </CollapsibleSection>
            
            <CollapsibleSection 
              title="Marketplace Ultra Exclusivo"
              defaultOpen={false}
            >
              <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
                Acceso al marketplace más exclusivo de México, donde solo los miembros selectos pueden descubrir oportunidades discretas reservadas para la élite. Un espacio donde la exclusividad trasciende lo convencional.
              </p>
              <p className="text-stone-400 font-serif text-sm italic mt-3 leading-relaxed tracking-wide">
                "Las verdaderas joyas nunca se exhiben públicamente."
              </p>
            </CollapsibleSection>
          </div>
          
          {/* Right column: Refined form */}
          <div className="flex items-center">
            <Card className="w-full bg-zinc-900 border border-amber-900/20 shadow-xl">
              <CardBody className="px-8 py-10 space-y-8">
                <div className="text-center space-y-4 mb-4">
                  <div className="inline-flex items-center space-x-2 mb-2">
                    <Crown className="w-4 h-4 text-amber-800" />
                    <span className="text-stone-300 text-xs font-serif tracking-widest">SOLO POR INVITACIÓN</span>
                  </div>
                  <h3 className="text-lg font-serif text-stone-200 tracking-wide">Acceso Exclusivo</h3>
                </div>
                
                <Form method="post" className="space-y-8">
                  <div>
                    <Input
                      type="text"
                      name="memberNumber"
                      label="Número de Miembro"
                      placeholder="Ingresa tu código de acceso"
                      value={memberNumber}
                      onChange={(e) => setMemberNumber(e.target.value)}
                      variant="bordered"
                      color="default"
                      classNames={{
                        inputWrapper: "bg-zinc-900 border-amber-900/20 hover:border-amber-800/40 focus-within:border-amber-800",
                        label: "text-stone-400 font-serif text-xs tracking-wide",
                        input: "text-stone-200 font-serif"
                      }}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full font-serif text-sm tracking-wider bg-zinc-900 text-amber-800 border border-amber-800/30 hover:bg-amber-900/10"
                    size="lg"
                  >
                    Verificar Acceso
                  </Button>
                </Form>
              </CardBody>
              
              <Divider className="bg-amber-900/10" />
              
              <CardFooter className="px-8 py-6">
                <p className="text-stone-500 text-xs font-serif tracking-wide text-center w-full">
                  El acceso al Cliquéalo Lounge es exclusivamente por invitación
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Mobile-only collapsible sections for responsive design */}
        <div className="md:hidden border-t border-zinc-800 pt-12 mb-20 space-y-4">
          <p className="text-center text-amber-800 font-serif text-xs tracking-wider mb-6">DISTINCIÓN EN MOVIMIENTO</p>
          
          <div className="space-y-4">
            <MobileCollapsibleSection 
              title="Acceso Premium"
              defaultOpen={false}
            >
              <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
                Anticipación exclusiva a nuestras adquisiciones más distinguidas y eventos privados reservados para miembros selectos.
              </p>
            </MobileCollapsibleSection>
            
            <MobileCollapsibleSection 
              title="Términos Privilegiados"
              defaultOpen={false}
            >
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
                  Opciones de financiamiento exclusivas y oportunidades de inversión para vehículos de colección seleccionados.
                </p>
              </div>
            </MobileCollapsibleSection>
            
            <MobileCollapsibleSection 
              title="Oportunidades Reservadas"
              defaultOpen={false}
            >
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
                  Opciones de financiamiento exclusivas y oportunidades de inversión para vehículos de colección seleccionados.
                </p>
              </div>
            </MobileCollapsibleSection>
          </div>
        </div>
        
        {/* Desktop-only feature section - hidden on mobile */}
        <div className="hidden md:grid grid-cols-3 gap-8 mb-20">
          <div className="p-8 border-t border-amber-900/20">
            <p className="text-amber-800 font-serif text-xs tracking-wider mb-4">EXPERIENCIA EXCLUSIVA</p>
            <h3 className="text-lg font-serif mb-4 text-stone-200 tracking-wide">Acceso Premium</h3>
            <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
              Anticipación exclusiva a nuestras adquisiciones más distinguidas y eventos privados reservados para miembros selectos.
            </p>
          </div>
          
          <div className="p-8 border-t border-amber-900/20">
            <p className="text-amber-800 font-serif text-xs tracking-wider mb-4">FINANCIAMIENTO</p>
            <h3 className="text-lg font-serif mb-4 text-stone-200 tracking-wide">Términos Privilegiados</h3>
            <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
              <CreditCard className="w-4 h-4 text-amber-800 inline-block mr-2" />
              Opciones de financiamiento exclusivas y oportunidades de inversión para vehículos de colección seleccionados.
            </p>
          </div>
          
          <div className="p-8 border-t border-amber-900/20">
            <p className="text-amber-800 font-serif text-xs tracking-wider mb-4">MARKETPLACE ÉLITE</p>
            <h3 className="text-lg font-serif mb-4 text-stone-200 tracking-wide">Círculo Reservado</h3>
            <p className="text-stone-400 font-serif text-sm leading-relaxed tracking-wide">
              El marketplace más exclusivo de México, donde solo los privilegiados acceden a oportunidades que nunca llegarán al público. Por invitación exclusiva.
            </p>
          </div>
        </div>

        {/* Minimal footer */}
        <footer className="text-center border-t border-amber-900/10 pt-8">
          <p className="text-amber-800/70 text-xs font-serif tracking-[0.3em]">
            THE CLIQUÉALO LOUNGE · EST. 2023
          </p>
        </footer>
      </div>
    </div>
  );
}