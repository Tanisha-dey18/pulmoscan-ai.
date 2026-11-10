import { ArrowRight, Brain, Clock, Eye, Layers, ShieldAlert, Stethoscope, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'

const SECTIONS = [
  { id: 'pneumonia', label: 'What is pneumonia?' },
  { id: 'early', label: 'Why early evaluation matters' },
  { id: 'cnn', label: 'Why a CNN?' },
  { id: 'how', label: 'How the model works' },
  { id: 'gradcam', label: 'Reading the heatmap' },
  { id: 'limits', label: 'Limitations' },
]

const PIPELINE = [
  ['Input', 'The X-ray is converted to grayscale, resized to 160 × 160 pixels and scaled to the 0-1 range.'],
  ['Feature extraction', 'Four convolutional blocks (16 → 32 → 64 → 128 filters) detect progressively more complex patterns: edges, then textures, then larger structures such as hazy regions in the lungs.'],
  ['Stabilising training', 'Batch normalisation after every convolution keeps activations well-scaled, and max-pooling halves the resolution after each block.'],
  ['Summarising', 'Global average pooling condenses the final feature maps into a short vector, one number per feature.'],
  ['Decision', 'A small dense layer with dropout feeds a single sigmoid neuron that outputs the probability of pneumonia. At 0.5 or above, the image is classified as Pneumonia.'],
]

const LIMITATIONS = [
  ['Not clinically validated', 'The model has never been tested in a clinical setting or reviewed by a regulator. It is a learning project.'],
  ['Narrow training data', 'All training images are paediatric X-rays (ages 1-5) from a single hospital. Performance on adults, other hospitals or other X-ray machines is unknown and likely worse.'],
  ['Only two answers', 'It can only say Normal or Pneumonia. It cannot recognise tuberculosis, COVID-19, tumours, fractures or any other finding - and will still pick one of its two labels.'],
  ['No input understanding', 'It does not know whether an upload is really a chest X-ray. A photo of a cat will also get a confident-looking answer.'],
  ['Confidence is not certainty', 'A 95% score means the network’s output was 0.95, not that 95 of 100 such patients have pneumonia. Neural networks are often over-confident.'],
  ['Heatmaps are approximate', 'Grad-CAM shows coarse regions that influenced the output. It does not outline disease and can highlight irrelevant areas.'],
  ['No clinical context', 'Doctors combine imaging with symptoms, examination and lab tests. The model sees pixels only.'],
]

function Section({ id, icon: Icon, title, children }) {
  return (
    <Reveal as="section" className="scroll-mt-24 border-b border-line py-10 first:pt-0 last:border-0">
      <div id={id} className="scroll-mt-24" />
      <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-cyan-300">
          <Icon className="size-4.5" aria-hidden />
        </span>
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </Reveal>
  )
}

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="About the project"
        title="The medicine, the method and the limits"
        description="A plain-language guide to what PulmoScan AI does, why it was built this way, and what it cannot do."
      />

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-14">
        {/* table of contents */}
        <nav className="hidden lg:block" aria-label="On this page">
          <div className="sticky top-24">
            <p className="eyebrow text-muted">On this page</p>
            <ul className="mt-4 space-y-1 border-l border-line">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted transition hover:border-teal-600 hover:text-ink">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <article className="max-w-3xl">
          <Section id="pneumonia" icon={Stethoscope} title="What is pneumonia?">
            <p>
              Pneumonia is an infection that inflames the tiny air sacs (alveoli) of one or both lungs. The sacs can
              fill with fluid or pus, which makes breathing painful and reduces how much oxygen reaches the blood.
              It is most often caused by bacteria or viruses, and less commonly by fungi.
            </p>
            <p>
              Typical symptoms include cough, fever, chills, chest pain and shortness of breath. It can affect anyone,
              but young children, older adults and people with weakened immune systems are at the highest risk. The
              World Health Organization lists pneumonia as the largest single infectious cause of death in children
              worldwide.
            </p>
            <p>
              On a chest X-ray, healthy lungs look dark because air lets X-rays pass through. Infected regions hold
              fluid and appear as lighter, hazy patches called <em>opacities</em> or <em>consolidation</em>. These are
              the visual patterns a model can learn.
            </p>
          </Section>

          <Section id="early" icon={Clock} title="Why early medical evaluation matters">
            <p>
              Pneumonia is usually treatable, and outcomes are much better when treatment starts early. Left untreated
              it can progress to serious complications such as breathing failure, fluid around the lungs or a
              bloodstream infection.
            </p>
            <p>
              Diagnosis is made by a clinician, who combines the patient’s symptoms and examination with tests such
              as a chest X-ray and blood work. Anyone with symptoms such as difficulty breathing, persistent fever or
              chest pain should seek medical care promptly rather than rely on any software.
            </p>
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
              PulmoScan AI is an educational demonstration. It does not provide medical advice and must never delay
              or replace seeing a doctor.
            </p>
          </Section>

          <Section id="cnn" icon={Brain} title="Why a CNN is suited to image classification">
            <p>
              Even a small 160 × 160 image has 25,600 pixels. A classic fully-connected network would treat every pixel as
              an unrelated number and need an enormous number of weights. A convolutional neural network (CNN) is
              designed around how images actually work:
            </p>
            <ul className="space-y-3">
              {[
                ['Local patterns', 'Small filters (3 × 3 here) slide across the image and respond to local features like edges and textures.'],
                ['Weight sharing', 'The same filter is reused at every position, so a pattern learned in one place is recognised everywhere - with far fewer parameters.'],
                ['Hierarchy', 'Stacked layers combine simple features into complex ones: edges → textures → anatomical structures.'],
                ['Learned features', 'Nobody hand-codes what pneumonia looks like. The filters are learned from labelled examples.'],
              ].map(([term, text]) => (
                <li key={term} className="flex gap-3">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-teal-600" />
                  <span>
                    <strong className="font-semibold text-ink">{term}.</strong> {text}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="how" icon={Workflow} title="How the model works">
            <ol className="space-y-px overflow-hidden rounded-xl bg-line ring-1 ring-line">
              {PIPELINE.map(([title, text], i) => (
                <li key={title} className="flex gap-4 bg-white p-4">
                  <span className="font-mono text-xs text-slate-400">0{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p>
              <strong className="font-semibold text-ink">Training.</strong> The network learned from labelled X-rays
              using the Adam optimizer and binary cross-entropy loss. Random rotations, shifts, zooms and
              brightness/contrast changes (data augmentation) made it see a slightly different version of each image
              every epoch. Because the dataset contains roughly three pneumonia images for every normal one, class
              weights made mistakes on the rarer class count more. Early stopping ended training when the validation
              loss stopped improving and restored the best weights.
            </p>
            <p>
              <strong className="font-semibold text-ink">Evaluation.</strong> The final model was scored once on a
              test set it had never seen. The measured results are on the{' '}
              <Link to="/insights" className="font-medium text-teal-700 underline-offset-4 hover:underline">Model Insights</Link> page.
            </p>
          </Section>

          <Section id="gradcam" icon={Eye} title="Reading the Grad-CAM heatmap">
            <p>
              Grad-CAM (Gradient-weighted Class Activation Mapping) answers the question “which parts of the image
              mattered for this prediction?”. It looks at the last convolutional layer, measures how strongly each
              feature map influences the predicted class using gradients, and combines them into a heatmap.
            </p>
            <p>
              Warm colours (yellow, orange, red) mark regions with the most influence; cool colours mark little or
              none. It is a sanity check on the model’s behaviour: a trustworthy prediction should focus on the lung
              fields, not on text markers or image borders. It is <em>not</em> a map of where disease is.
            </p>
          </Section>

          <Section id="limits" icon={ShieldAlert} title="Project limitations">
            <ul className="divide-y divide-line rounded-xl bg-white ring-1 ring-line">
              {LIMITATIONS.map(([title, text]) => (
                <li key={title} className="p-4">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Reveal className="mt-4 flex flex-col items-start justify-between gap-4 rounded-xl bg-navy-900 p-6 text-white sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Layers className="size-5 text-cyan-300" aria-hidden />
              <p className="text-sm text-slate-200">See the architecture and the measured results.</p>
            </div>
            <Link to="/insights" className="btn btn-accent">
              Model Insights <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </article>
      </div>
    </>
  )
}
