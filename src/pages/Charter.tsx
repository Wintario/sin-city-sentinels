import { useEffect } from 'react';
import { motion } from 'framer-motion';

const Charter = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: 'Основные положения',
      items: [
        'Клан является организацией, действующей в рамках Арены, опираясь на законы Арены.',
        'Клан не является исключительно военной организацией. Все члены клана имеют равное значение.',
        'В клане состоят только необходимые ему люди. Лишних среди нас нет.'
      ]
    },
    {
      title: 'Цели',
      items: [
        'Клан не принимает ни одну из сторон - света или тьмы, добра или зла, хаоса или равновесия, - до тех пор, пока в том нет для него выгоды.',
        'Клан является нейтральным. Все конфликты, не затрагивающие наши интересы, не имеют для нас значения.',
        'Если клан вмешивается в конфликт - это не значит, что он поддерживает одну из сторон. Это лишь значит, что он противостоит одной из них.',
        'Единственное, чем руководствуется клан - благополучие клана и его членов. Мы пониманием и принимаем понятия чести, совести и благородства. Но клан для нас семья, и потому ради клана или его членов мы готовы поступиться этими понятиями. Никто не будет думать о совести и чести, когда над семьей нависла угроза'
      ]
    },
    {
      title: 'Взаимоотношения внутри клана',
      items: [
        'Все члены клана - братья. У всех одни цели. Поэтому каждый новый член должен быть принят со всей благожелательностью.',
        'Бойцы клана обязаны по возможности помогать друг другу.',
        'Бой для бойцов клана - способ сделать себя, а значит, и клан, сильнее. Поэтому боец имеет право принимать участие в любых боях и вмешиваться в любые бои, в том числе и против соклановца, однако обязан перед этим спросить, согласен ли тот на его вмешательство.'
      ]
    },
    {
      title: 'Взаимоотношения клана и бойца',
      items: [
        'Клан - это все для его члена. Но клан в свою очередь заботится о благополучии каждого бойца в отдельности, так как совокупность бойцов и составляет наш клан, нашу семью.',
        'Боец обязан следовать уставу клана. Разрешено все, что не запрещено уставом. Нарушители устава будут подвергаться наказаниям вплоть до исключения из клана.',
        'Боец имеет право получать любую помощь от клана - боевую, материальную, моральную.',
        'Боец обязан делать для клана все, что в его силах.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-black to-black"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-red-500/5 blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-20 pb-16 px-4 text-center border-b border-red-900/30"
        >
          <h1 className="text-6xl font-black mb-4">
            <span className="text-white">УСТАВ</span>
            <br />
            <span className="text-red-500">СВИРЕПЫХ КРОЛИКОВ</span>
          </h1>
          <p className="text-xl text-red-400 mt-6 max-w-2xl mx-auto">
            Основной закон нашего клана, определяющий принципы организации и поведения её членов
          </p>
        </motion.div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="mb-12"
            >
              {/* Section Title */}
              <div className="mb-6 pb-4 border-b-2 border-red-500/50">
                <h2 className="text-3xl font-bold text-red-500">{section.title}</h2>
              </div>

              {/* Section Items */}
              <div className="space-y-4 ml-4">
                {section.items.map((item, itemIdx) => (
                  <motion.div
                    key={itemIdx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: itemIdx * 0.05 }}
                    className="flex gap-4"
                  >
                    {/* Bullet */}
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                    </div>

                    {/* Text */}
                    <p className="text-lg text-gray-300 leading-relaxed flex-1">
                      {item}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 py-16 px-4 border-t border-red-900/30 text-center"
        >
          <p className="text-red-400 text-xl font-semibold">
            Клан — это семья. Честь и достоинство каждого члена — честь и достоинство клана.
          </p>
          <p className="text-gray-500 mt-6">
            © Свирепые Кролики | Клан Арены
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Charter;