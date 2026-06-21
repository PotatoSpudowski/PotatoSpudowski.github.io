import { Fade } from '../components/BlogPrimitives'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ============ CHART DATA ============

const ablation = [
  { name: 'pose + bbox\n+ rgb', sr: 77.6, fde: 1.25 },
  { name: 'bbox + rgb\n(no pose)', sr: 16.8, fde: 3.82 },
  { name: 'rgb only', sr: 18.2, fde: 3.61 },
  { name: 'pose only', sr: 73.1, fde: 1.41 },
]

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="blog-chart-tooltip">
      <div style={{ color: '#fff', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {p.name === 'SR@1m' ? `${p.value}%` : `${p.value} m`}
        </div>
      ))}
    </div>
  )
}

// ============ BLOG ============

export default function CosFlyTrackBlog() {
  return (
    <main className="main blog-main">

      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <img src="/cosfly-hero.jpg" alt="" className="blog-hero-img" />
            <h1 className="blog-title">training drones to track things without crashing</h1>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        {/* ====== 01 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the problem</h2>
          <p className="blog-p">most aerial vision-language datasets ask a drone to go somewhere. go to coordinate x, follow this waypoint list. CosFly-Track starts from the messier thing people actually want in the field: stay with a moving subject without flying into anything or losing the shot.</p>
          <p className="blog-p">a route can end at the right coordinate and still be useless for tracking if the target slipped behind a wall ten seconds earlier. in a follow task the drone has to manage distance, line of sight, yaw, pitch, collision risk, and smooth motion throughout the clip. all of that matters every frame, not just at the end.</p>
        </section>

        {/* ====== 02 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">what the dataset actually is</h2>
          <p className="blog-p">CosFly-Track contains about 12,000 expert and perturbed UAV trajectories generated from roughly 6,000 pedestrian paths. full dataset covers 2.4 million timesteps, about 334 hours of tracking, across 16 CARLA town variants and multiple weather or lighting conditions.</p>
          <p className="blog-p">each trajectory has seven aligned channels: RGB, metric depth, semantic segmentation, 6-DoF drone pose, target state with visibility flag, bilingual Chinese-English instructions, and trajectory-pair metadata. the release is useful beyond rendered video. it gives an AI drone model camera data, state, target visibility, and the motion it should have taken.</p>
          <p className="blog-p">zero-shot VLMs mostly fail at the control task. after supervised fine-tuning on 200K CosFly-Track samples, seven vision-language models reach 78.3% to 95.6% SR@1m, a 53 to 69 percentage-point improvement over zero-shot baselines. that result does not settle real-world tracking. it does show that the dataset contains learnable structure for a task ordinary aerial navigation data tends to miss.</p>
        </section>

        {/* ====== 03 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">why the data has to be different</h2>
          <p className="blog-p">a good tracking path is judged at every frame. is the target visible? is the viewing distance reasonable? is the pitch angle useful? is the drone path smooth enough to fly? is the route safe? grid planners are awkward here. they can find a collision-free path and smoothing can make the route look better, but the smoothed result may still inherit bad visibility or strange motion from the original grid search.</p>
          <p className="blog-p">CosFly-Track uses MuCO, a multi-constraint optimizer that works directly in continuous 3D space. its objective balances tracking distance, smoothness, jerk, safety, visibility, viewpoint quality, pitch, altitude, and path length. BVH queries keep collision and visibility checks fast. unsafe waypoints are handled with soft costs, geometric projection, and velocity repair.</p>
          <p className="blog-p">in the 20-path comparison, a strong A* baseline gets better visibility. MuCO runs about 22x faster, produces paths about 13% shorter, and keeps visibility above 0.90 on 16 of the 20 trajectories. for thousands of paths that speed is part of the contribution.</p>
        </section>

        {/* ====== 04 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the paired-trajectory trick</h2>
          <p className="blog-p">the most useful design choice may be the paired data. every pedestrian path produces an expert drone trajectory plus a perturbed version. the perturbations are small, ordinary mistakes. the drone or pedestrian shifts by a few meters, the viewing angle drifts, or both happen together.</p>
          <p className="blog-p">that gives researchers a few ways to train. a model can imitate expert waypoints, recover from noisy history, compare clean and degraded tracking, or use the pairs for DAgger-style correction. this is closer to a real developer drone system where the aircraft will not always sit exactly on the expert trajectory.</p>
          <p className="blog-p">the ablation supports that choice. denoising from perturbed input to expert target gives the best FDE and SR@1m in the reported setup. expert-only training hurts yaw prediction, which is exactly the kind of failure that shows up when a camera drone has to correct its view instead of merely continue a clean path.</p>
        </section>

        {/* ====== 05 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">what the benchmark says</h2>
          <p className="blog-p">the model table is most useful as a warning about inputs. after fine-tuning, Qwen3.5-9B reaches 95.60% SR@1m, GLM-4.6V-Flash reaches 95.48%, and Qwen3-VL-8B reaches 95.22%. Gemma-4-E4B is lower at 78.34%.</p>
          <p className="blog-p">pose history does most of the work in this benchmark. removing it makes final displacement error jump from about 1.25 m to more than 3.8 m, and SR@1m drops from 77.6% to roughly 16-18%. bounding boxes matter for target prediction. RGB adds only a small gain once pose and bbox history are already present.</p>

          <div style={{ padding: '22px 14px 6px', background: 'var(--bg-code)', borderRadius: 4, marginBottom: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ablation} barGap={6} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                <YAxis tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CTooltip />} />
                <Bar dataKey="sr" name="SR@1m" fill="#79c0ff" opacity={0.6} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="blog-p">i would not read that as a claim that vision is optional. the benchmark still leans heavily on structured state. in rougher field conditions visual cues may carry more of the burden in occlusion, pedestrian motion, traffic, glare, weather, and camera artifacts.</p>
        </section>

        {/* ====== 06 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">where this fits</h2>
          <p className="blog-p">for drone autonomy CosFly-Track points toward a useful AI training primitive for target-following data where motion, view quality, and recovery behavior are tied together. the practical product question is recovery. can a model learn how to regain the right distance, yaw, and viewing angle after the drone has drifted away from the expert path? that is more valuable than copying a perfect route.</p>
          <p className="blog-p">safety layers, operator control, geofencing, and command limits still have to wrap anything learned. CosFly-Track is interesting because it gives the learning layer a better starting point.</p>
        </section>

        {/* ====== 07 ====== */}
        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">limits</h2>
          <p className="blog-p">the data comes from CARLA so sim-to-real transfer remains the big open question. the authors say real-world data is being collected for a future release. this version should be treated as a training and benchmarking resource, not proof that a model can follow people outside.</p>
          <p className="blog-p">the generation pipeline is not fully open-source because of company policy, although the paper gives algorithm detail for reimplementing the optimizer. the current release is an initial subset of about 100K multi-modal frames, with expansion planned.</p>
          <p className="blog-p">there is also the obvious dual-use issue. UAV tracking is useful for search and rescue, filming, sports analysis, wildlife monitoring, and inspection. the same capability can be misused for surveillance. the dataset license restricts unauthorized surveillance and military targeting.</p>
          <p className="blog-p">paper: <a href="https://arxiv.org/abs/2605.17776" target="_blank" rel="noopener noreferrer">arXiv 2605.17776</a></p>
          <p className="blog-p">dataset: <a href="https://huggingface.co/datasets/AutelRobotics/CosFly" target="_blank" rel="noopener noreferrer">huggingface.co/datasets/AutelRobotics/CosFly</a></p>
          <p className="blog-p">checkpoints: <a href="https://huggingface.co/AutelRobotics/CosFly-Track" target="_blank" rel="noopener noreferrer">huggingface.co/AutelRobotics/CosFly-Track</a></p>
        </section>

      </div>
    </main>
  )
}
