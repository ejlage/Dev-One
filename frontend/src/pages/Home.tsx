import { Link } from 'react-router';
import { Calendar, Users, Sparkles, Award } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-[#0a1a17]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1769653066440-9dc79237ea24?w=1600')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a17]/60 via-transparent to-[#0a1a17]/80" />
        <div className="relative z-10 text-center text-white px-4">
          <div className="mb-4 inline-block">
            <span className="text-[#c9a84c] tracking-[0.4em] uppercase text-sm">Escola de Dança & Artes Performativas</span>
          </div>
          <h1 className="text-6xl md:text-8xl mb-6 tracking-tight" style={{ fontWeight: 700 }}>
            ENT'<span className="text-[#c9a84c]">ARTES</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/80 max-w-2xl mx-auto">
            Onde cada movimento conta uma história e cada aluno é uma estrela
          </p>
        </div>
        {/* Decorative bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f4f9f8] to-transparent" />
      </section>

      {/* Sobre Nós */}
      <section className="py-20 px-4 bg-[#f4f9f8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#c9a84c] tracking-widest uppercase text-sm">Quem Somos</span>
            <h2 className="text-4xl md:text-5xl mt-2 text-[#0a1a17]">
              Sobre a ENT'ARTES
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-[#c9a84c]/30 rounded-2xl" />
              <img
                src="https://images.unsplash.com/photo-1769653066440-9dc79237ea24?w=600"
                alt="ENT'ARTES escola de dança"
                className="rounded-2xl shadow-2xl w-full object-cover relative z-10"
                style={{ aspectRatio: '4/3' }}
              />
            </div>
            <div className="space-y-6">
              <p className="text-lg text-[#0a1a17]/80">
                A ENT'ARTES é uma escola de dança dedicada a formar artistas completos,
                combinando técnica rigorosa com expressão artística autêntica.
              </p>
              <p className="text-lg text-[#0a1a17]/80">
                Com mais de 15 anos de experiência, oferecemos aulas de ballet clássico,
                dança contemporânea, hip-hop, jazz, e muito mais. A nossa equipa de professores
                qualificados está comprometida em nutrir o talento de cada aluno.
              </p>
              <p className="text-lg text-[#0a1a17]/80">
                Acreditamos que a dança é para todos, independentemente da idade ou nível de experiência.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="text-center">
                  <div className="text-3xl text-[#0d6b5e]" style={{ fontWeight: 700 }}>15+</div>
                  <div className="text-sm text-[#4d7068]">Anos de história</div>
                </div>
                <div className="w-px h-12 bg-[#c9a84c]/30" />
                <div className="text-center">
                  <div className="text-3xl text-[#0d6b5e]" style={{ fontWeight: 700 }}>300+</div>
                  <div className="text-sm text-[#4d7068]">Alunos formados</div>
                </div>
                <div className="w-px h-12 bg-[#c9a84c]/30" />
                <div className="text-center">
                  <div className="text-3xl text-[#0d6b5e]" style={{ fontWeight: 700 }}>6</div>
                  <div className="text-sm text-[#4d7068]">Modalidades</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="py-20 px-4 bg-[#0a1a17]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] tracking-widest uppercase text-sm">Diferenciais</span>
            <h2 className="text-4xl md:text-5xl mt-2 text-white">
              Porquê ENT'ARTES?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#162e28] p-8 rounded-2xl text-center border border-[#c9a84c]/10 hover:border-[#c9a84c]/40 transition-colors group">
              <div className="w-16 h-16 bg-[#0d6b5e]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#0d6b5e]/40 transition-colors">
                <Users className="w-8 h-8 text-[#c9a84c]" />
              </div>
              <h3 className="text-xl mb-3 text-white">Professores Qualificados</h3>
              <p className="text-white/60">
                Equipa experiente e dedicada ao desenvolvimento de cada aluno
              </p>
            </div>

            <div className="bg-[#162e28] p-8 rounded-2xl text-center border border-[#c9a84c]/10 hover:border-[#c9a84c]/40 transition-colors group">
              <div className="w-16 h-16 bg-[#0d6b5e]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#0d6b5e]/40 transition-colors">
                <Calendar className="w-8 h-8 text-[#c9a84c]" />
              </div>
              <h3 className="text-xl mb-3 text-white">Horários Flexíveis</h3>
              <p className="text-white/60">
                Aulas adaptadas às necessidades de alunos e encarregados
              </p>
            </div>

            <div className="bg-[#162e28] p-8 rounded-2xl text-center border border-[#c9a84c]/10 hover:border-[#c9a84c]/40 transition-colors group">
              <div className="w-16 h-16 bg-[#0d6b5e]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#0d6b5e]/40 transition-colors">
                <Sparkles className="w-8 h-8 text-[#c9a84c]" />
              </div>
              <h3 className="text-xl mb-3 text-white">Estúdios Modernos</h3>
              <p className="text-white/60">
                Instalações equipadas com tecnologia de ponta
              </p>
            </div>

            <div className="bg-[#162e28] p-8 rounded-2xl text-center border border-[#c9a84c]/10 hover:border-[#c9a84c]/40 transition-colors group">
              <div className="w-16 h-16 bg-[#0d6b5e]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#0d6b5e]/40 transition-colors">
                <Award className="w-8 h-8 text-[#c9a84c]" />
              </div>
              <h3 className="text-xl mb-3 text-white">Eventos & Espetáculos</h3>
              <p className="text-white/60">
                Oportunidades regulares de atuação em palco
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modalidades */}
      <section className="py-20 px-4 bg-[#f4f9f8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] tracking-widest uppercase text-sm">O que ensinamos</span>
            <h2 className="text-4xl md:text-5xl mt-2 text-[#0a1a17]">
              Modalidades
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1769651409831-3f3d8677782a?w=600"
                alt="Ballet Clássico"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a17] via-[#0a1a17]/20 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <div className="w-8 h-0.5 bg-[#c9a84c] mb-3" />
                  <h3 className="text-2xl mb-1">Ballet Clássico</h3>
                  <p className="text-white/70 text-sm">Técnica e elegância da dança clássica</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1763740341759-c6b54c0552ea?w=600"
                alt="Hip-Hop"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a17] via-[#0a1a17]/20 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <div className="w-8 h-0.5 bg-[#c9a84c] mb-3" />
                  <h3 className="text-2xl mb-1">Hip-Hop</h3>
                  <p className="text-white/70 text-sm">Energia e ritmo da cultura urbana</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1765278543368-6e89f3e080bf?w=600"
                alt="Contemporâneo"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a17] via-[#0a1a17]/20 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <div className="w-8 h-0.5 bg-[#c9a84c] mb-3" />
                  <h3 className="text-2xl mb-1">Contemporâneo</h3>
                  <p className="text-white/70 text-sm">Expressão e criatividade sem limites</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1769653066440-9dc79237ea24?w=600"
                alt="Jazz"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a17] via-[#0a1a17]/20 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <div className="w-8 h-0.5 bg-[#c9a84c] mb-3" />
                  <h3 className="text-2xl mb-1">Jazz</h3>
                  <p className="text-white/70 text-sm">Dinamismo e estilo Broadway</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1665765422248-6df88f47f92e?w=600"
                alt="Danças Latinas"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a17] via-[#0a1a17]/20 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <div className="w-8 h-0.5 bg-[#c9a84c] mb-3" />
                  <h3 className="text-2xl mb-1">Danças Latinas</h3>
                  <p className="text-white/70 text-sm">Paixão e ritmo latino</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1748842806398-f9df692ef9f9?w=600"
                alt="Sapateado"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a17] via-[#0a1a17]/20 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <div className="w-8 h-0.5 bg-[#c9a84c] mb-3" />
                  <h3 className="text-2xl mb-1">Sapateado</h3>
                  <p className="text-white/70 text-sm">Ritmo percussivo nos pés</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-[#0a1a17] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, #c9a84c 0%, transparent 50%),
                              radial-gradient(circle at 70% 50%, #0d6b5e 0%, transparent 50%)`
          }}
        />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-[#c9a84c] tracking-widest uppercase text-sm">Junte-se a nós</span>
          <h2 className="text-4xl md:text-5xl mt-3 mb-6">
            Pronto para Dançar?
          </h2>
          <p className="text-xl mb-10 text-white/70">
            Junte-se à família ENT'ARTES e descubra o artista que existe em você
          </p>
          <Link
            to="/experimentar"
            className="inline-block bg-[#c9a84c] text-[#0a1a17] px-10 py-4 rounded-full hover:bg-[#e8c97a] transition-colors"
            style={{ fontWeight: 600 }}
          >
            Começar Agora
          </Link>
        </div>
      </section>
    </div>
  );
}
