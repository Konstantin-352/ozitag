interface IHTMLElementOfCustom extends HTMLElement {
    __swiper?: any;
    __grid?: any;
}

(function () {
    let action = new Action();
    const MOBILE = 1250;

    function ev(event) {
        event = event || window.event;
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }

    function addListen(el, eve, hander) {
        if (el.addEventListener) {
            el.addEventListener(eve, hander, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + eve, hander);
        } else {
            el['on' + eve] = hander;
        }
    }

    function removeListen(el, eve, handler) {
        if (el.removeEventListener) {
            el.removeEventListener(eve, handler);
        } else if (el.detachEvent) {
            el.detachEvent(eve, handler);
        } else {
            delete el['on' + eve];
        }
    }

    function parentClass(t, cl, repeater = -1) {
        if (t && (repeater === -1 || repeater !== 0)) {
            const p = t.parentNode;
            if (p && p !== document) {
                if (p.classList.contains(cl)) {
                    return p;
                } else {
                    return parentClass(p, cl, (repeater < -1 ? -1 : (repeater - 1)));
                }
            }
            return null;
        }
    }

    function classReplacement(selector, classname, e = null) {
        Array.from(document.querySelectorAll(selector))
            .filter(item => item.classList.contains(classname))
            .forEach(item => {
                item.classList.remove(classname);
            });
        if (e) {
            e.classList.add(classname);
        }
    }

    function Action(key = 'data-action') {
        this.data = {};

        this.add = function (name, act, handler) {
            if (!this.data[name]) {
                this.data[name] = [];
            }

            this.data[name].push({
                type: act,
                handle: handler
            });
        };

        this.trigger = function (name = null) {
            let KEY = '['.concat(key).concat((name ? '='.concat(name) : '')).concat(']'),
                that = this;
            document.querySelectorAll(KEY).forEach(function (item) {
                if (item.getAttribute(key) && that.data[item.getAttribute(key)]) {
                    let hand = that.data[item.getAttribute(key)];
                    hand.forEach(function (main) {
                        removeListen(item, main.type, main.handle);
                        addListen(item, main.type, main.handle);
                    });
                }
            });
        };
    }

    action.add('header-nav_item-hover', 'mouseenter', function (e) {
        if (innerWidth >= MOBILE) {
            ev(e);
            this.classList.add('__hover');
            this.querySelector('.header-nav_wrap') && document.body.classList.add('__shadow-show');
        }
    });

    action.add('header-nav_item-hover', 'mouseleave', function (e) {
        if (innerWidth >= MOBILE) {
            ev(e);
            this.classList.remove('__hover');
            this.querySelector('.header-nav_wrap') && document.body.classList.remove('__shadow-show');
        }
    });

    action.add('menu-open', 'click', function (e) {
        ev(e);
        document.body.classList.toggle('__menu-open');
        document.body.classList.toggle('__shadow-show');
    });

    action.add('show-submenu', 'click', function (e) {
        ev(e);
        let parent = parentClass(this, 'js-parent', 2);

        if (parent) {
            let block = parent.querySelector('[data-level]');

            if (block) {
                addHideClass(`[data-level='${block.dataset.level}']`, document, block);
                block.classList.toggle('__hide');
                block.classList.contains('__hide') && addHideClass('[data-level]', block);
            }

            let scroll = document.querySelector('.header-nav');
            let header = document.querySelector('header');

            scroll && header && scroll.scroll({
                top: scroll.scrollTop + parent.getBoundingClientRect().top - header.offsetHeight,
                left: 0,
                behavior: 'smooth'
            });

        }
    });

    /**
     *
     * @param cl
     * @param wrap
     * @param block
     */
    function addHideClass(cl: string, wrap, block = null) {
        let levelBlocks = wrap.querySelectorAll(cl);

        if (levelBlocks) {
            levelBlocks.forEach(i => {

                if (i !== block) {
                    i.classList.add('__hide');
                    addHideClass('[data-level]', i);
                }
            });
        }
    }

    addListen(document, 'DOMContentLoaded', function () {
        action.trigger();

    });

})();
