const defaults = {
  color: 'purple',
  bgColor: '#ccc',
  max: 200,
  min: 100,
  step: 10,
  strokeWidth: 15,
  value: 150, // so we can see some difference
  radius: 125,
  onChange: null,
  onAfterChange: null
}

const classNamePrefix = 'RoundSlider'
const DEGREE_IN_RADIANS = Math.PI / 180
let touches = []

class RoundSlider {
  constructor(selector, options) {
    this.element = document.querySelector(selector)
    this.selector = selector
    if (!this.element) {
      console.error('Element could not be found.')
      return
    }
    this.uniqueId = Math.floor(Math.random() * 100) + Date.now() // uniqueId
    this.element.append
    this.options = { ...defaults, ...options }
    this.value = this.options.value
    this.element.className = classNamePrefix
    this.svgWrap = document.createElement('div')
    this.handle = document.createElement('div')
    this.handle.className = 'sliderHandle'
    this.element.append(this.svgWrap)
    this.element.append(this.handle)

    this.element.addEventListener(
      'click',
      e => this.allowChange && this.setValue(e, true),
      false
    )
    this.handle.addEventListener('mouseup', this.up, false)
    this.element.addEventListener('mouseup', this.up, false)
    this.handle.addEventListener('touchstart', this.down, false)
    this.element.addEventListener('touchend', this.up, false)
    this.element.addEventListener('touchcancel', this.up, false)
    this.handle.addEventListener('mousedown', this.down, false)
    this.updateView()
  }
  
  getTouchMove = e => {
    if (this.allowChange || this.isDrag) {
      let idx = 0
      for (let index = 0; index < e.changedTouches.length; index++) {
        const t = e.changedTouches[index]
        if (t.identifier >= 0 ) {
          touches = [t]
          this.setValue(touches[idx]) 
        }
        
      }
    }
  }
  
  up = e => {
    this.element.style.pointerEvents = 'none'
    this.allowChange = false
    this.isDrag = false
    this.element.removeEventListener('mousemove', this.setValue, true)
    this.element.removeEventListener('touchmove', this.setValue, true)
    touches = [] // clear touches
    this.options.onAfterChange && this.options.onAfterChange(this.value)
  }
  
  down = e => {
    this.element.style.pointerEvents = 'auto'
    e.preventDefault
    this.isDrag = true
    this.allowChange = true
    if (e.changedTouches) {
      touches.push(...e.changedTouches)
      this.element.addEventListener('touchmove', this.getTouchMove, false)
    } else {
      this.element.addEventListener('mousemove', this.setValue, true)
    }
  }
  
  setValue = (event, forceSet) => {
    if (!this.isDrag && !forceSet) return
    let eX,
      eY = 0
    if (event.force) {
      const { pageX, pageY } = event
      eX = pageX
      eY = pageY
    } else {
      eX = event.x
      eY = event.y
    }
    const { left, top } = this.getCenter()
    const x = eX - left,
    y = eY - top
    const { value, angle } = this.stepRounding(this.angle(y, x))
    this.value = value
    this.updateView()
    this.options.onChange && this.options.onChange(value)
  }

  angleToValue = angle => {
    const { min, max } = this.options
    const v = angle / 360 * (max - min) + min
    return v
  }

  valueToAngle = value => {
    const { max, min } = this.options
    const angle = (value - min) / (max - min) * 359.9999
    return angle
  }

  getCenter() {
    var rect = this.element.getBoundingClientRect()
    return {
      top: rect.top + rect.height / 2,
      left: rect.left + rect.width / 2
    }
  }

  clamp(angle) {
    return Math.max(0, Math.min(angle || 0, this.options.max))
  }

  stepRounding(degree) {
    const { step, min, max } = this.options
    const value = this.angleToValue(degree)
    let remain, currVal, nextVal, preVal, val, ang
    remain = (value - this.options.min) % step
    currVal = value - remain
    nextVal = this.limitValue(currVal + step)
    preVal = this.limitValue(currVal - step)

    if (value >= currVal)
      val = value - currVal < nextVal - value ? currVal : nextVal
    else val = currVal - value > value - preVal ? currVal : preVal
    val = Math.round(val)
    ang = this.valueToAngle(val)
    return { value: val, angle: ang }
  }

  limitValue = value => {
    const { min, max } = this.options
    if (value < min) value = min
    if (value > max) value = max
    return value
  }

  radToDeg(rad) {
    return rad * (180 / Math.PI)
  }

  angle(y, x) {
    let angle = this.radToDeg(Math.atan2(y, x))
    if (angle < 0 && x < 0) angle += 360
    return angle + 90
  }

  updateView() {
    const { step, radius, min, max, strokeWidth, color, bgColor } = this.options
    const segments = (max - min) / step
    const maskName = `${classNamePrefix}_${this.uniqueId}`
    const svgEl = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width='${radius *
      2}' height='${radius * 2}'>
          <defs>
            <mask id="${maskName}">
              <rect x='0' y='0' width='${radius * 2}' height='${radius *
      2}' fill='white' />
              ${step &&
                Array(segments)
                  .fill()
                  .map((e, i) => {
                    return this.getMaskLine({ segments, radius, index: i })
                  })
                  .join('\n')}
            </mask>
          </defs>
          
          <circle 
            cx="${radius}" 
            cy="${radius}" 
            r="${radius - strokeWidth / 2}" 
            fill='transparent' 
            stroke-dashoffset="0" 
            stroke-width='${strokeWidth}' 
            stroke='${bgColor}' 
            mask="url(#${maskName})" 
            />
        <path
            fill="none"
            stroke-width="${strokeWidth}"
            stroke="${color}"
            opacity="0.7"
            d="${this.getArc({
              max,
              min,
              radius,
              strokeWidth,
              current: this.value
            })}"
          />
        </svg>`
    this.svgWrap.innerHTML = svgEl
    this.handle.style.transform = `rotate(${this.valueToAngle(this.value) -
      90}deg)`
  }

  createView(element) {
    element.className = classNamePrefix
  }

  getArc({ max, min, radius, strokeWidth, current }) {
    const value = Math.max(0, Math.min(current || 0, max))
    const angle = this.valueToAngle(current)
    const pathRadius = radius - strokeWidth / 2
    const start = this.polarToCartesian({
      radius,
      pathRadius,
      angle,
      strokeWidth
    })
    const end = this.polarToCartesian({
      radius,
      pathRadius,
      angle: 0,
      strokeWidth
    })
    const arcSweep = angle <= 180 ? 0 : 1

    return `M ${start} A ${pathRadius} ${pathRadius} 0 ${arcSweep} 0 ${end}`
  }

  polarToCartesian({ pathRadius, angle, radius, strokeWidth }) {
    const angleInRadians = (angle - 90) * DEGREE_IN_RADIANS
    const x = radius + pathRadius * Math.cos(angleInRadians)
    const y = radius + pathRadius * Math.sin(angleInRadians)

    return x + ' ' + y
  }

  calcOffset() {
    const { max, radius, strokeWidth, value } = RoundSlider.options
    const r = radius - strokeWidth
    const c = Math.PI * r * 2
    const offset = (1 - value / max) * c
    return offset
  }
  getMaskLine({ radius, segments, index }) {
    //prettier-ignore
    return `<line x1="${radius}" y1="${radius}" x2="${radius * 2}" y2="${radius}"
              style="stroke:rgb(0,0,0);stroke-width:2; transform: rotate(${((360 / segments) * index - 90)}deg);transform-origin: 0% 0%;" />`
  }
}

// ## Just for testing
new RoundSlider('#app', { color: 'red' })
export default RoundSlider
