/* eslint-env mocha */

import React from 'react';
import PropTypes from 'prop-types';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import { spy } from 'sinon';
import { render, unmountComponentAtNode } from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import EventListener, { withOptions } from './index';

describe('EventListener', () => {
  describe('prop: children', () => {
    it('should work without', () => {
      const wrapper = shallow(<EventListener target="window" />);

      assert.strictEqual(wrapper.children().length, 0, 'Should work without children');
    });

    it('should render it', () => {
      const wrapper = shallow(
        <EventListener target="window">
          <div>Foo</div>
        </EventListener>,
      );

      assert.strictEqual(wrapper.children().length, 1, 'Should render his children.');
    });
  });

  let node;
  beforeEach(() => {
    // Pattern from "react-router": http://git.io/vWpfs
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    unmountComponentAtNode(node);
    node.parentNode.removeChild(node);
  });

  describe('prop: target', () => {
    it('should work with a string', () => {
      const handleClick = spy();

      render(<EventListener target="document" onClick={handleClick} />, node);
      document.body.click();
      assert.strictEqual(handleClick.callCount, 1);
    });

    it('should work with a node', () => {
      const handleClick = spy();

      render(<EventListener target={document} onClick={handleClick} />, node);
      document.body.click();
      assert.strictEqual(handleClick.callCount, 1);
    });
  });

  [
    {
      contextName: 'using Simulate.click(extraNode)',
      name: 'should not invoke event listener to document',
      invokeFn(extraNode) {
        Simulate.click(extraNode);
      },
      expectFn(handle) {
        assert.strictEqual(handle.callCount, 0);
      },
    },
    {
      contextName: 'using extraNode.click()',
      name: 'should invoke event listener to document',
      invokeFn(extraNode) {
        extraNode.click();
      },
      expectFn(handle) {
        assert.strictEqual(handle.callCount, 1);
      },
    },
  ].forEach(({ contextName, name, invokeFn, expectFn }) => {
    describe(contextName, () => {
      it(name, () => {
        class TextComponent extends React.Component {
          static propTypes = {
            onClick: PropTypes.func,
          };

          handleClick = () => {
            this.props.onClick();
          };

          render() {
            return <EventListener target={document} onClick={this.handleClick} />;
          }
        }

        const handleClick = spy();

        render(<TextComponent onClick={handleClick} />, node);

        assert.strictEqual(handleClick.callCount, 0);

        const extraNode = document.createElement('button');
        document.body.appendChild(extraNode);

        invokeFn(extraNode);
        expectFn(handleClick);

        extraNode.parentNode.removeChild(extraNode);
      });
    });
  });

  describe('when props change', () => {
    it('removes old listeners', () => {
      const handleClick = spy();

      render(<EventListener target={document} onClick={handleClick} />, node);
      render(<EventListener target={document} />, node);

      document.body.click();
      assert.strictEqual(handleClick.callCount, 0);
    });

    it('adds new listeners', () => {
      const handleClick = spy();

      render(<EventListener target={document} />, node);

      document.body.click();
      assert.strictEqual(handleClick.callCount, 0);

      render(<EventListener target={document} onClick={handleClick} />, node);

      document.body.click();
      assert.strictEqual(handleClick.callCount, 1);
    });

    describe('lifecycle', () => {
      let extraNode;

      beforeEach(() => {
        extraNode = document.createElement('button');
        document.body.appendChild(extraNode);
      });

      afterEach(() => {
        extraNode.parentNode.removeChild(extraNode);
      });

      it('removes listeners from old node', () => {
        const handleClick = spy();

        render(<EventListener target={document} onClick={handleClick} />, node);
        render(<EventListener target={extraNode} onClick={handleClick} />, node);

        document.body.click();
        assert.strictEqual(handleClick.callCount, 0);
      });

      it('adds listeners to new node', () => {
        const handleClick = spy();

        render(<EventListener target={extraNode} onClick={handleClick} />, node);
        render(<EventListener target={document} onClick={handleClick} />, node);
        document.body.click();
        assert.strictEqual(handleClick.callCount, 1);
      });
    });

    it("doesn't update if props are shallow equal", () => {
      const handleClick = () => {};
      const inst = render(<EventListener target={document} onClick={handleClick} />, node);
      const componentWillUpdate = inst.componentWillUpdate;
      let updated = false;
      inst.componentWillUpdate = (...args) => {
        updated = true;
        componentWillUpdate.bind(inst)(...args);
      };
      render(<EventListener target={document} onClick={handleClick} />, node);
      assert.strictEqual(updated, false);
    });
  });

  describe('when using capture phase', () => {
    it('attaches listeners with capture', () => {
      let button;
      const calls = [];

      render(
        <div>
          <EventListener target={document} onClickCapture={() => calls.push('outer')} />
          <button
            type="submit"
            ref={c => {
              button = c;
            }}
            onClick={() => calls.push('inner')}
          />
        </div>,
        node,
      );

      assert.strictEqual(calls.length, 0);
      button.click();
      assert.deepEqual(calls, ['outer', 'inner'], 'Should be called in the right order.');
    });
  });

  describe('when using withOptions helper', () => {
    it('should return handler function & event options of merging default values', () => {
      const obj = withOptions(() => 'test', {});
      assert.strictEqual(obj.handler(), 'test');
      assert.deepEqual(obj.options, { capture: false, passive: false });
    });

    it('should work with using withOptions helper', () => {
      const handleClick = spy();

      render(<EventListener target={document} onClick={withOptions(handleClick, {})} />, node);
      document.body.click();
      assert.strictEqual(handleClick.callCount, 1);
    });

    it('attaches listeners with capture (withOptions)', () => {
      let button = null;
      const calls = [];

      render(
        <div>
          <EventListener
            target={document}
            onClick={withOptions(() => calls.push('outer'), { capture: true })}
          />
          <button
            type="submit"
            ref={c => {
              button = c;
            }}
            onClick={() => calls.push('inner')}
          />
        </div>,
        node,
      );

      assert.strictEqual(calls.length, 0);
      button.click();
      assert.deepEqual(calls, ['outer', 'inner'], 'Should be called in the right order.');
    });
  });
});
